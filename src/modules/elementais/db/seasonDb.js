'use strict';

const { query, transaction } = require('../../../database/dbConnection');

/**
 * Registra ou atualiza uma temporada.
 * Agora preserva a integridade das tabelas mestre para não quebrar o histórico.
 */
async function addOrUpdateSeason(data) {
  return transaction(async (connection) => {
    // 1. Desativa a temporada atual
    await connection.execute('UPDATE tb_elemental_season SET is_current = 0');

    // 2. Insere ou atualiza a nova temporada, marcando-a como atual
    const [result] = await connection.execute(
      `INSERT INTO tb_elemental_season (code, chapter, season_number, name, is_current)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         chapter = VALUES(chapter),
         season_number = VALUES(season_number),
         name = VALUES(name),
         is_current = 1`,
      [data.code, data.chapter, data.season_number, data.name]
    );

    let seasonId = result.insertId;
    if (!seasonId) {
      const [seasonRows] = await connection.execute(
        'SELECT id_season FROM tb_elemental_season WHERE code = ?',
        [data.code]
      );
      seasonId = seasonRows[0].id_season;
    }

    // A MÁGICA: Não damos mais UPDATE SET is_active = 0 nas tabelas base.
    // O simples fato de mudar a temporada ativa já envia tudo para o cofre, 
    // pois a tb_elemental_season_variant da nova temporada estará vazia!

    return seasonId;
  });
}

async function getCurrentSeason() {
  const result = await query('SELECT * FROM tb_elemental_season WHERE is_current = 1 LIMIT 1');
  return result.length > 0 ? result[0] : null;
}

/**
 * Vincula uma variante à temporada ativa
 */
async function linkVariantToSeason(seasonId, variantId, isActive = 1) {
  await query(
    `INSERT INTO tb_elemental_season_variant (fk_id_season, fk_id_variant, is_active)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)`,
    [seasonId, variantId, isActive]
  );
}

/**
 * Alterna a visibilidade de uma variante especificamente para a temporada atual
 */
async function toggleSeasonVariantStatus(variantId) {
  const season = await getCurrentSeason();
  if (!season) throw new Error('Sem temporada ativa.');
  
  const record = await query('SELECT is_active FROM tb_elemental_season_variant WHERE fk_id_season = ? AND fk_id_variant = ?', [season.id_season, variantId]);
  
  const newStatus = (record.length > 0 && record[0].is_active === 1) ? 0 : 1;

  await query(
    `INSERT INTO tb_elemental_season_variant (fk_id_season, fk_id_variant, is_active) 
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)`,
    [season.id_season, variantId, newStatus]
  );
  
  return newStatus;
}

module.exports = {
  addOrUpdateSeason,
  getCurrentSeason,
  linkVariantToSeason,
  toggleSeasonVariantStatus
};