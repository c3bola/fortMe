'use strict';

const { query } = require('../../../database/dbConnection');

async function getCurrentSeasonId() {
  const result = await query('SELECT id_season FROM tb_elemental_season WHERE is_current = 1 LIMIT 1');
  return result.length > 0 ? result[0].id_season : null;
}

/**
 * Busca (ou cria) a configuração do módulo Elementais do usuário
 */
async function getUserElementalConfig(userId) {
  try {
    userId = BigInt(userId).toString();
    const existing = await query(
      'SELECT * FROM tb_elemental_user_config WHERE fk_id_user = ?',
      [userId]
    );

    if (existing.length > 0) return existing[0];

    // Se não existir, cria com os valores padrão (tudo ativo)
    await query(
      `INSERT INTO tb_elemental_user_config (fk_id_user, accept_help_requests, allow_private_messages, allow_group_mention)
       VALUES (?, 1, 1, 1)`,
      [userId]
    );

    return { fk_id_user: userId, accept_help_requests: 1, allow_private_messages: 1, allow_group_mention: 1 };
  } catch (error) {
    console.error('[DB] Erro ao buscar/criar config Elementais do usuário:', error.message);
    throw error;
  }
}

/**
 * Atualiza as configurações do módulo Elementais do usuário
 */
async function updateUserElementalConfig(userId, data) {
  try {
    userId = BigInt(userId).toString();
    const { accept_help_requests, allow_private_messages, allow_group_mention, collection_image_id, custom_cover_file_id } = data;

    await getUserElementalConfig(userId); // garante que a row existe

    const updates = [];
    const params = [];

    if (accept_help_requests !== undefined)   { updates.push('accept_help_requests = ?');   params.push(accept_help_requests); }
    if (allow_private_messages !== undefined) { updates.push('allow_private_messages = ?'); params.push(allow_private_messages); }
    if (allow_group_mention !== undefined)    { updates.push('allow_group_mention = ?');    params.push(allow_group_mention); }
    if (collection_image_id !== undefined)    { updates.push('collection_image_id = ?');    params.push(collection_image_id); }
    if (custom_cover_file_id !== undefined)   { updates.push('custom_cover_file_id = ?');   params.push(custom_cover_file_id); }

    if (updates.length === 0) return;

    params.push(userId);
    await query(
      `UPDATE tb_elemental_user_config SET ${updates.join(', ')}, updated_at = NOW() WHERE fk_id_user = ?`,
      params
    );
  } catch (error) {
    console.error('[DB] Erro ao atualizar config Elementais do usuário:', error.message);
    throw error;
  }
}

/**
 * Busca usuários que possuem a variante e aceitam pedidos de ajuda
 */
async function getHelpersForVariant(variantId, limit = 10) {
  try {
    const seasonId = await getCurrentSeasonId();
    if (seasonId === null) return [];

    const limitNum = Math.min(Number(limit) || 10, 15);
    const result = await query(
      `SELECT 
        c.fk_id_user AS user_id,
        MAX(CASE WHEN du_fname.fk_id_metadata = 1 THEN du_fname.value END) AS first_name,
        MAX(CASE WHEN du_uname.fk_id_metadata = 3 THEN du_uname.value END) AS username,
        cfg.allow_group_mention
       FROM tb_elemental_collection c
       JOIN tb_elemental_user_config cfg ON c.fk_id_user = cfg.fk_id_user
       LEFT JOIN tb_data_user du_fname ON c.fk_id_user = du_fname.fk_id_user AND du_fname.fk_id_metadata = 1
       LEFT JOIN tb_data_user du_uname ON c.fk_id_user = du_uname.fk_id_user AND du_uname.fk_id_metadata = 3
       WHERE c.fk_id_variant = ?
         AND c.fk_id_season = ?
         AND cfg.accept_help_requests = 1
       GROUP BY c.fk_id_user, cfg.allow_group_mention
       ORDER BY RAND()
       LIMIT ${limitNum}`,
      [variantId, seasonId]
    );
    return result;
  } catch (error) {
    console.error('[DB] Erro ao buscar ajudantes para variante:', error.message);
    return [];
  }
}

/**
 * Registra uma ajuda entre dois usuários no diário/log de ajuda
 */
async function recordHelp(helperId, helpedId, groupId, variantId = null, note = null) {
  try {
    helperId = BigInt(helperId).toString();
    helpedId = BigInt(helpedId).toString();
    groupId  = BigInt(groupId).toString();
    const seasonId = await getCurrentSeasonId();

    const result = await query(
      `INSERT INTO tb_elemental_help_log (fk_helper_id, fk_helped_id, fk_group_id, fk_id_season, fk_id_variant, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [helperId, helpedId, groupId, seasonId, variantId, note]
    );
    return result.insertId;
  } catch (error) {
    console.error('[DB] Erro ao registrar ajuda:', error.message);
    throw error;
  }
}

/**
 * Busca o ranking de guardiões (quem mais ajudou) com os nomes resolvidos
 */
async function getTopHelpersWithNames(groupId, limit = 10) {
  try {
    groupId = BigInt(groupId).toString();
    const seasonId = await getCurrentSeasonId();
    if (seasonId === null) {
      console.log(`⚠️ [DB] Nenhuma temporada ativa encontrada para o grupo ${groupId}!`);
      return [];
    }
    
    const limitNum = Math.min(Number(limit) || 10, 15);
    
    // Substituído o LIMIT ? pela interpolação para evitar falhas silenciosas do MySQL2
    const result = await query(
      `SELECT 
        h.fk_helper_id AS user_id, 
        COUNT(*) AS total_helped,
        MAX(CASE WHEN du_fname.fk_id_metadata = 1 THEN du_fname.value END) AS first_name,
        MAX(CASE WHEN du_uname.fk_id_metadata = 3 THEN du_uname.value END) AS username
       FROM tb_elemental_help_log h
       LEFT JOIN tb_data_user du_fname ON h.fk_helper_id = du_fname.fk_id_user AND du_fname.fk_id_metadata = 1
       LEFT JOIN tb_data_user du_uname ON h.fk_helper_id = du_uname.fk_id_user AND du_uname.fk_id_metadata = 3
       WHERE h.fk_group_id = ?
         AND h.fk_id_season = ?
       GROUP BY h.fk_helper_id
       ORDER BY total_helped DESC
       LIMIT ${limitNum}`,
      [groupId, seasonId]
    );

    // Mapeia o resultado garantindo que o BigInt do COUNT vire um Número legível para o bot
    return result.map(row => ({
      ...row,
      total_helped: Number(row.total_helped) 
    }));

  } catch (error) {
    console.error('[DB] Erro ao buscar top helpers com nomes:', error.message);
    return [];
  }
}

async function getUserByUsername(username) {
  const cleanUsername = username.replace(/^@/, '');
  const result = await query(
    `SELECT
       u.id_user,
       MAX(CASE WHEN du_fname.fk_id_metadata = 1 THEN du_fname.value END) AS first_name,
       MAX(CASE WHEN du_uname.fk_id_metadata = 3 THEN du_uname.value END) AS username
     FROM tb_user u
     JOIN tb_data_user du_uname
       ON u.id_user = du_uname.fk_id_user AND du_uname.fk_id_metadata = 3
     LEFT JOIN tb_data_user du_fname
       ON u.id_user = du_fname.fk_id_user AND du_fname.fk_id_metadata = 1
     WHERE LOWER(du_uname.value) = LOWER(?)
     GROUP BY u.id_user`,
    [cleanUsername]
  );
  return result.length > 0 ? result[0] : null;
}

async function getRecentActivity(groupId, limit = 10) {
  const seasonId = await getCurrentSeasonId();
  if (seasonId === null) return [];

  const limitNum = Math.min(Number(limit) || 10, 15);
  const result = await query(
    `SELECT col.fk_id_user AS user_id, col.marked_at,
            v.id_elemental_variant, s.name AS sprite_name,
            c.name AS category_name
     FROM tb_elemental_collection col
     JOIN tb_elemental_variant v ON col.fk_id_variant = v.id_elemental_variant
     JOIN tb_elemental_sprite s ON v.fk_id_sprite = s.id_elemental_sprite
     JOIN tb_elemental_category c ON v.fk_id_category = c.id_elemental_category
     WHERE col.fk_id_season = ?
       AND col.fk_id_user IN (
         SELECT DISTINCT fk_helper_id FROM tb_elemental_help_log WHERE fk_group_id = ? AND fk_id_season = ?
         UNION
         SELECT DISTINCT fk_helped_id FROM tb_elemental_help_log WHERE fk_group_id = ? AND fk_id_season = ?
       )
     ORDER BY col.marked_at DESC
     LIMIT ${limitNum}`,
    [seasonId, groupId, seasonId, groupId, seasonId]
  );
  return result;
}

/**
 * Registra múltiplos agradecimentos de uma vez (Bulk Insert)
 */
async function recordMultipleHelps(helperId, helpedId, groupId, variantIds, note = null) {
  if (!variantIds || variantIds.length === 0) return 0;
  
  try {
    helperId = BigInt(helperId).toString();
    helpedId = BigInt(helpedId).toString();
    groupId  = BigInt(groupId).toString();
    const seasonId = await getCurrentSeasonId();

    const placeholders = variantIds.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const values = [];
    
    for (const vid of variantIds) {
      values.push(helperId, helpedId, groupId, seasonId, vid, note);
    }

    const result = await query(
      `INSERT INTO tb_elemental_help_log (fk_helper_id, fk_helped_id, fk_group_id, fk_id_season, fk_id_variant, note)
       VALUES ${placeholders}`,
      values
    );
    return result.affectedRows;
  } catch (error) {
    console.error('[DB] Erro ao registrar ajudas múltiplas:', error.message);
    throw error;
  }
}

module.exports = {
  getUserElementalConfig,
  updateUserElementalConfig,
  getHelpersForVariant,
  recordHelp,
  getTopHelpersWithNames,
  getUserByUsername,
  getRecentActivity,
  recordMultipleHelps,
};