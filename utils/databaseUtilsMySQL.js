const { query, transaction } = require('../database/dbConnection');

/**
 * =====================================================
 * DATABASE UTILITIES - MySQL Version
 * =====================================================
 * Utilitários para interagir com o banco MySQL do FortMe Bot
 * Substitui as funções antigas que usavam JSON
 */

// =====================================================
// USERS - Gerenciamento de Usuários
// =====================================================

/**
 * Cria ou busca um usuário no banco e salva metadados
 * @param {number|string} userId - ID do usuário do Telegram
 * @param {number} profileId - ID do perfil (1=user, 4=admin)
 * @param {object} userData - Dados do usuário do Telegram (first_name, last_name, username)
 * @returns {Promise<object>} Usuário criado/encontrado
 */
async function ensureUser(userId, profileId = 1, userData = {}) {
  try {
    userId = BigInt(userId).toString();
    
    // Verifica se usuário já existe
    const existing = await query(
      'SELECT * FROM tb_user WHERE id_user = ?',
      [userId]
    );
    
    if (existing.length > 0) {
      // Usuário existe - atualizar metadados se fornecidos
      if (Object.keys(userData).length > 0) {
        await updateUserMetadata(userId, userData);
      }
      return existing[0];
    }
    
    // Cria novo usuário
    await query(
      'INSERT INTO tb_user (id_user, fk_id_profile) VALUES (?, ?)',
      [userId, profileId]
    );
    
    console.log(`[DB] ✓ Usuário ${userId} criado com perfil ${profileId}`);
    
    // Salvar metadados iniciais
    if (Object.keys(userData).length > 0) {
      await updateUserMetadata(userId, userData);
    }
    
    return { id_user: userId, fk_id_profile: profileId };
  } catch (error) {
    console.error('[DB] Erro ao criar/buscar usuário:', error.message);
    throw error;
  }
}

/**
 * Atualiza ou insere metadados do usuário
 * @param {string} userId - ID do usuário
 * @param {object} userData - { first_name, last_name, username }
 * @returns {Promise<void>}
 */
async function updateUserMetadata(userId, userData) {
  try {
    const metadataMap = {
      'first_name': 1,  // id_metadata para first_name
      'last_name': 2,   // id_metadata para last_name
      'username': 3     // id_metadata para username
    };

    for (const [key, value] of Object.entries(userData)) {
      if (!value || !metadataMap[key]) continue;

      const metadataId = metadataMap[key];

      // Verifica se já existe
      const existing = await query(
        'SELECT * FROM tb_data_user WHERE fk_id_user = ? AND fk_id_metadata = ?',
        [userId, metadataId]
      );

      if (existing.length > 0) {
        // Atualiza se mudou
        if (existing[0].value !== value) {
          await query(
            'UPDATE tb_data_user SET value = ? WHERE fk_id_user = ? AND fk_id_metadata = ?',
            [value, userId, metadataId]
          );
          console.log(`[DB] ✓ Metadado ${key} atualizado para usuário ${userId}`);
        }
      } else {
        // Insere novo metadado
        await query(
          'INSERT INTO tb_data_user (fk_id_user, fk_id_metadata, value) VALUES (?, ?, ?)',
          [userId, metadataId, value]
        );
        console.log(`[DB] ✓ Metadado ${key} criado para usuário ${userId}`);
      }
    }
  } catch (error) {
    console.error('[DB] Erro ao atualizar metadados do usuário:', error.message);
    // Não lança erro - metadados são opcionais
  }
}

/**
 * Verifica se um usuário é admin
 * @param {number|string} userId 
 * @returns {Promise<boolean>}
 */
async function isAdmin(userId) {
  try {
    userId = BigInt(userId).toString();
    const result = await query(
      'SELECT fk_id_profile FROM tb_user WHERE id_user = ?',
      [userId]
    );
    
    return result.length > 0 && result[0].fk_id_profile === 4;
  } catch (error) {
    console.error('[DB] Erro ao verificar admin:', error.message);
    return false;
  }
}

// =====================================================
// COMMUNITIES - Gerenciamento de Grupos
// =====================================================

/**
 * Cria ou atualiza um grupo/comunidade (tb_community - grupos com supervisão admin)
 * @param {number|string} groupId - ID do grupo do Telegram
 * @param {string} groupName - Nome do grupo
 * @param {string} type - Tipo: 'group' ou 'channel'
 * @returns {Promise<object>}
 */
async function ensureCommunity(groupId, groupName = 'Grupo sem nome', type = 'group') {
  try {
    groupId = BigInt(groupId).toString();
    
    // Verifica se já existe
    const existing = await query(
      'SELECT * FROM tb_community WHERE group_id_community = ?',
      [groupId]
    );
    
    if (existing.length > 0) {
      // Atualiza nome se mudou
      if (existing[0].group_name !== groupName) {
        await query(
          'UPDATE tb_community SET group_name = ?, updated_at = NOW() WHERE group_id_community = ?',
          [groupName, groupId]
        );
      }
      return existing[0];
    }
    
    // Cria novo grupo
    await query(
      `INSERT INTO tb_community 
       (group_id_community, group_name, total_members, status, type, requires_subscription) 
       VALUES (?, ?, 0, 1, ?, 0)`,
      [groupId, groupName, type]
    );
    
    console.log(`[DB] ✓ Comunidade ${groupId} (${groupName}) criada`);
    
    return {
      group_id_community: groupId,
      group_name: groupName,
      type,
      status: 1
    };
  } catch (error) {
    console.error('[DB] Erro ao criar/atualizar comunidade:', error.message);
    throw error;
  }
}

/**
 * Registra grupo onde bot foi usado (tb_bot_groups - para broadcast)
 * @param {number|string} groupId 
 * @param {string} groupName 
 * @returns {Promise<void>}
 */
async function ensureBotGroup(groupId, groupName = 'Grupo sem nome') {
  try {
    groupId = BigInt(groupId).toString();
    
    // Verifica se já existe
    const existing = await query(
      'SELECT * FROM tb_bot_groups WHERE group_id = ?',
      [groupId]
    );
    
    if (existing.length > 0) {
      // Atualiza nome e contador
      await query(
        `UPDATE tb_bot_groups 
         SET group_name = ?, total_commands_used = total_commands_used + 1, updated_at = NOW() 
         WHERE group_id = ?`,
        [groupName, groupId]
      );
      return;
    }
    
    // Registra novo grupo
    await query(
      `INSERT INTO tb_bot_groups 
       (group_id, group_name, total_commands_used, status) 
       VALUES (?, ?, 1, 1)`,
      [groupId, groupName]
    );
    
    console.log(`[DB] ✓ Grupo registrado para broadcast: ${groupId} (${groupName})`);
  } catch (error) {
    console.error('[DB] Erro ao registrar grupo no broadcast:', error.message);
    // Não lança erro - broadcast é opcional
  }
}

/**
 * Atualiza o contador de membros de um grupo
 * @param {number|string} groupId 
 * @param {number} totalMembers 
 */
async function updateMemberCount(groupId, totalMembers) {
  try {
    groupId = BigInt(groupId).toString();
    await query(
      'UPDATE tb_community SET total_members = ?, updated_at = NOW() WHERE group_id_community = ?',
      [totalMembers, groupId]
    );
  } catch (error) {
    console.error('[DB] Erro ao atualizar contador de membros:', error.message);
  }
}

/**
 * Busca todos os grupos ativos para broadcast
 * @returns {Promise<Array>}
 */
async function getBroadcastGroups() {
  try {
    const result = await query(
      'SELECT group_id, group_name FROM tb_bot_groups WHERE status = 1 ORDER BY group_name'
    );
    return result;
  } catch (error) {
    console.error('[DB] Erro ao buscar grupos para broadcast:', error.message);
    return [];
  }
}

// =====================================================
// FORTME CONTENTS - Gerenciamento de Conteúdos
// =====================================================

/**
 * Busca um conteúdo aleatório de uma feature específica
 * @param {number} featureId - ID da feature (1=fortme, 2=fortgirl, 3=jonesyme, etc)
 * @param {Array<number>} excludeIds - IDs para excluir da busca
 * @returns {Promise<object|null>} Conteúdo aleatório ou null
 */
async function getRandomContent(featureId, excludeIds = []) {
  try {
    let sql = `
      SELECT * FROM tb_fortme_contents 
      WHERE fk_id_features = ? AND status = 1
    `;
    const params = [featureId];
    
    if (excludeIds.length > 0) {
      sql += ` AND id_fortme_contents NOT IN (${excludeIds.map(() => '?').join(',')})`;
      params.push(...excludeIds);
    }
    
    sql += ' ORDER BY RAND() LIMIT 1';
    
    const result = await query(sql, params);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[DB] Erro ao buscar conteúdo aleatório:', error.message);
    throw error;
  }
}

/**
 * Adiciona um novo conteúdo
 * @param {object} data - Dados do conteúdo
 * @returns {Promise<number>} ID do conteúdo criado
 */
async function addContent(data) {
  try {
    const { featureId, createdBy, text, imageId, status = 1 } = data;
    
    const result = await query(
      `INSERT INTO tb_fortme_contents 
       (fk_id_features, created_by, text, image_id, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [featureId, createdBy, text, imageId, status]
    );
    
    console.log(`[DB] ✓ Conteúdo adicionado com ID ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error('[DB] Erro ao adicionar conteúdo:', error.message);
    throw error;
  }
}

/**
 * Remove um conteúdo (desativa)
 * @param {number} contentId 
 */
async function removeContent(contentId) {
  try {
    await query(
      'UPDATE tb_fortme_contents SET status = 0 WHERE id_fortme_contents = ?',
      [contentId]
    );
    console.log(`[DB] ✓ Conteúdo ${contentId} desativado`);
  } catch (error) {
    console.error('[DB] Erro ao remover conteúdo:', error.message);
    throw error;
  }
}

// =====================================================
// DAILY USAGE - Uso Diário de Comandos
// =====================================================

/**
 * Verifica se usuário já usou o comando hoje
 * @param {number} featureId 
 * @param {string} groupId 
 * @param {string} userId 
 * @param {string} date - Formato YYYY-MM-DD
 * @returns {Promise<object|null>}
 */
async function getDailyUsage(featureId, groupId, userId, date) {
  try {
    const result = await query(
      `SELECT * FROM tb_fortme_daily_usage 
       WHERE fk_id_features = ? 
       AND fk_group_id = ? 
       AND fk_id_user = ? 
       AND used_date = ?`,
      [featureId, groupId, userId, date]
    );
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[DB] Erro ao verificar uso diário:', error.message);
    throw error;
  }
}

/**
 * Registra uso de um comando
 * @param {object} data 
 * @returns {Promise<number>} ID do registro
 */
async function recordDailyUsage(data) {
  try {
    const { featureId, contentId, groupId, userId, messageId, date } = data;
    
    const result = await query(
      `INSERT INTO tb_fortme_daily_usage 
       (fk_id_features, fk_id_contents, fk_group_id, fk_id_user, message_id, used_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [featureId, contentId, groupId, userId, messageId, date]
    );
    
    console.log(`[DB] ✓ Uso diário registrado - Feature ${featureId}, User ${userId}`);
    return result.insertId;
  } catch (error) {
    console.error('[DB] Erro ao registrar uso diário:', error.message);
    throw error;
  }
}

/**
 * Busca ranking diário de uma feature em um grupo
 * @param {number} featureId 
 * @param {string} groupId 
 * @param {string} date 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getDailyRanking(featureId, groupId, date, limit = 10) {
  try {
    const result = await query(
      `SELECT 
        u.fk_id_user as user_id,
        c.text,
        c.image_id,
        du.message_id,
        du.created_at,
        COALESCE(SUM(CASE WHEN v.vote = 'heart' THEN 1 ELSE 0 END), 0) as hearts,
        COALESCE(SUM(CASE WHEN v.vote = 'hat' THEN 1 ELSE 0 END), 0) as hats
       FROM tb_fortme_daily_usage du
       INNER JOIN tb_user u ON du.fk_id_user = u.id_user
       INNER JOIN tb_fortme_contents c ON du.fk_id_contents = c.id_fortme_contents
       LEFT JOIN tb_fortme_votes v ON du.id_fortme_daily_usage = v.fk_daily_usage_id
       WHERE du.fk_id_features = ?
       AND du.fk_group_id = ?
       AND du.used_date = ?
       GROUP BY du.id_fortme_daily_usage
       ORDER BY hearts DESC, hats ASC
       LIMIT ?`,
      [featureId, groupId, date, limit]
    );
    
    return result;
  } catch (error) {
    console.error('[DB] Erro ao buscar ranking diário:', error.message);
    throw error;
  }
}

// =====================================================
// VOTES - Sistema de Votação
// =====================================================

/**
 * Registra ou atualiza um voto
 * @param {number} dailyUsageId 
 * @param {string} voterId 
 * @param {string} voteType - 'heart' ou 'hat'
 * @returns {Promise<boolean>}
 */
async function recordVote(dailyUsageId, voterId, voteType) {
  try {
    voterId = BigInt(voterId).toString();
    
    console.log(`[DB] Registrando voto - DailyUsageId: ${dailyUsageId}, Voter: ${voterId}, Type: ${voteType}`);
    
    // Verifica se já votou
    const existing = await query(
      'SELECT * FROM tb_fortme_votes WHERE fk_daily_usage_id = ? AND voter_id = ?',
      [dailyUsageId, voterId]
    );
    
    if (existing.length > 0) {
      console.log(`[DB] Atualizando voto existente (era: ${existing[0].vote}, agora: ${voteType})`);
      // Atualiza voto
      await query(
        'UPDATE tb_fortme_votes SET vote = ?, created_at = NOW() WHERE fk_daily_usage_id = ? AND voter_id = ?',
        [voteType, dailyUsageId, voterId]
      );
      console.log('[DB] ✓ Voto atualizado com sucesso');
      return true;
    }
    
    // Novo voto
    console.log('[DB] Inserindo novo voto');
    await query(
      'INSERT INTO tb_fortme_votes (voter_id, fk_daily_usage_id, vote) VALUES (?, ?, ?)',
      [voterId, dailyUsageId, voteType]
    );
    console.log('[DB] ✓ Voto inserido com sucesso');
    
    return true;
  } catch (error) {
    console.error('[DB] Erro ao registrar voto:', error.message);
    console.error('[DB] Stack:', error.stack);
    throw error;
  }
}

/**
 * Busca votos de um uso diário
 * @param {number} dailyUsageId 
 * @returns {Promise<object>} {hearts: number, hats: number}
 */
async function getVotes(dailyUsageId) {
  try {
    console.log(`[DB] Buscando votos para dailyUsageId: ${dailyUsageId}`);
    
    const result = await query(
      `SELECT 
        SUM(CASE WHEN vote = 'heart' THEN 1 ELSE 0 END) as hearts,
        SUM(CASE WHEN vote = 'hat' THEN 1 ELSE 0 END) as hats
       FROM tb_fortme_votes
       WHERE fk_daily_usage_id = ?`,
      [dailyUsageId]
    );
    
    const votes = {
      hearts: parseInt(result[0].hearts) || 0,
      hats: parseInt(result[0].hats) || 0
    };
    
    console.log(`[DB] ✓ Votos encontrados: ${votes.hearts} hearts, ${votes.hats} hats`);
    
    return votes;
  } catch (error) {
    console.error('[DB] Erro ao buscar votos:', error.message);
    return { hearts: 0, hats: 0 };
  }
}

// =====================================================
// DUELS - Sistema de X1
// =====================================================

/**
 * Cria um novo duelo
 * @param {object} data 
 * @returns {Promise<number>} ID do duelo
 */
/**
 * Cria um novo duelo
 * @param {string|object} groupIdOrData - ID do grupo OU objeto com todos os dados
 * @param {string} challengerId - ID do desafiante (se primeiro parâmetro for groupId)
 * @param {string} opponentId - ID do oponente (se primeiro parâmetro for groupId)
 * @param {number} isTryhard - Se é duelo tryhard (se primeiro parâmetro for groupId)
 * @returns {Promise<number>} ID do duelo criado
 */
async function createDuel(groupIdOrData, challengerId, opponentId, isTryhard = 0) {
  try {
    let groupId, challenger, opponent, tryhard, winnerId, status;
    
    // Suporta ambos: createDuel(groupId, challengerId, opponentId, isTryhard) 
    // OU createDuel({ groupId, challengerId, opponentId, winnerId, isTryhard, status })
    if (typeof groupIdOrData === 'object') {
      const data = groupIdOrData;
      groupId = data.groupId;
      challenger = data.challengerId;
      opponent = data.opponentId;
      winnerId = data.winnerId || null;
      tryhard = data.isTryhard || 0;
      status = data.status || 'started';
    } else {
      groupId = groupIdOrData;
      challenger = challengerId;
      opponent = opponentId;
      tryhard = isTryhard;
      winnerId = null;
      status = 'started';
    }
    
    const result = await query(
      `INSERT INTO tb_fortme_duels 
       (fk_group_id, challenger_id, opponent_id, winner_id, status, is_tryhard) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [groupId, challenger, opponent, winnerId, status, tryhard]
    );
    
    console.log(`[DB] ✓ Duelo criado: ${challenger} vs ${opponent}`);
    return result.insertId;
  } catch (error) {
    console.error('[DB] Erro ao criar duelo:', error.message);
    throw error;
  }
}

/**
 * Atualiza estatísticas de duelo de um usuário
 * @param {string} groupId 
 * @param {string} userId 
 * @param {object} stats - {wins?, duels_started?, duels_completed?, duels_abandoned?, tryhard?, banana?}
 */
async function updateDuelStats(groupId, userId, stats) {
  try {
    const updates = [];
    const params = [];
    
    if (stats.wins !== undefined) {
      updates.push('wins = wins + ?');
      params.push(stats.wins);
    }
    if (stats.duels_started !== undefined) {
      updates.push('duels_started = duels_started + ?');
      params.push(stats.duels_started);
    }
    if (stats.duels_completed !== undefined) {
      updates.push('duels_completed = duels_completed + ?');
      params.push(stats.duels_completed);
    }
    if (stats.duels_abandoned !== undefined) {
      updates.push('duels_abandoned = duels_abandoned + ?');
      params.push(stats.duels_abandoned);
    }
    if (stats.tryhard !== undefined) {
      updates.push('tryhard = tryhard + ?');
      params.push(stats.tryhard);
    }
    if (stats.banana !== undefined) {
      updates.push('banana = banana + ?');
      params.push(stats.banana);
    }
    
    if (updates.length === 0) return;
    
    params.push(groupId, userId);
    
    await query(
      `INSERT INTO tb_fortme_user_stats (fk_group_id, fk_id_user, ${Object.keys(stats).join(', ')})
       VALUES (?, ?, ${Object.keys(stats).map(() => '?').join(', ')})
       ON DUPLICATE KEY UPDATE ${updates.join(', ')}`,
      [groupId, userId, ...Object.values(stats)]
    );
    
    console.log(`[DB] ✓ Stats atualizadas para usuário ${userId}`);
  } catch (error) {
    console.error('[DB] Erro ao atualizar stats de duelo:', error.message);
    throw error;
  }
}

/**
 * Busca ranking de X1 de um grupo
 * @param {string} groupId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getX1Ranking(groupId, limit = 10) {
  try {
    const result = await query(
      `SELECT 
        fk_id_user as user_id,
        wins,
        duels_completed,
        tryhard,
        banana
       FROM tb_fortme_user_stats
       WHERE fk_group_id = ?
       ORDER BY wins DESC, duels_completed DESC
       LIMIT ?`,
      [groupId, limit]
    );
    
    return result;
  } catch (error) {
    console.error('[DB] Erro ao buscar ranking X1:', error.message);
    return [];
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Obtém data atual no formato YYYY-MM-DD (horário de Brasília)
 * @returns {string}
 */
function getCurrentDate() {
  const now = new Date();
  const brasiliaDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000 - 3 * 3600000);
  return brasiliaDate.toISOString().split('T')[0];
}

/**
 * Verifica se o comando foi executado em um grupo
 * @param {object} ctx - Contexto do Telegraf
 * @returns {boolean}
 */
function isGroupCommand(ctx) {
  return ctx.chat && ctx.chat.type && (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup');
}

/**
 * Obtém informações do grupo
 * @param {object} ctx - Contexto do Telegraf
 * @returns {object}
 */
function getGroupInfo(ctx) {
  return {
    id: ctx.chat.id.toString(),
    name: ctx.chat.title || 'Grupo sem nome',
    username: ctx.chat.username || null,
    type: ctx.chat.type
  };
}

/**
 * Obtém informações do usuário
 * @param {object} ctx - Contexto do Telegraf
 * @returns {object}
 */
function getUserInfo(ctx) {
  return {
    id: ctx.from.id.toString(),
    username: ctx.from.username || ctx.from.first_name,
    firstName: ctx.from.first_name,
    lastName: ctx.from.lastName || null
  };
}

// =====================================================
// BROADCAST - Sistema de Broadcast
// =====================================================

/**
 * Salva histórico de broadcast
 * @param {string} adminId 
 * @param {string} messageText 
 * @param {object} messageFormat - JSON com formatação Telegram
 * @param {number} totalGroups 
 * @param {number} successfulSends 
 * @param {number} failedSends 
 * @returns {Promise<number>} ID do broadcast
 */
async function saveBroadcastHistory(adminId, messageText, messageFormat, totalGroups, successfulSends, failedSends) {
  try {
    const result = await query(
      `INSERT INTO tb_broadcast_history 
       (sent_by_admin, message_text, message_format, total_groups, successful_sends, failed_sends) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, messageText, JSON.stringify(messageFormat), totalGroups, successfulSends, failedSends]
    );
    
    console.log(`[DB] ✓ Broadcast registrado: ${successfulSends}/${totalGroups} enviados`);
    return result.insertId;
  } catch (error) {
    console.error('[DB] Erro ao salvar histórico de broadcast:', error.message);
    throw error;
  }
}

/**
 * Busca histórico de broadcasts
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getBroadcastHistory(limit = 10) {
  try {
    const result = await query(
      `SELECT * FROM tb_broadcast_history 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [limit]
    );
    return result;
  } catch (error) {
    console.error('[DB] Erro ao buscar histórico de broadcast:', error.message);
    return [];
  }
}

// =====================================================
// RANKINGS - Sistema de Rankings
// =====================================================

/**
 * Busca mais amado e mais odiado do dia (fortme/fortgirl/jonesyme)
 * @param {number} featureId 
 * @param {string} groupId 
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<object>} {mostLoved, mostHated}
 */
async function getDailyLoveHateRanking(featureId, groupId, date) {
  try {
    // Mais amado
    const mostLoved = await query(
      `SELECT 
        du.fk_id_user as user_id,
        SUM(CASE WHEN v.vote = 'heart' THEN 1 ELSE 0 END) as hearts,
        SUM(CASE WHEN v.vote = 'hat' THEN 1 ELSE 0 END) as hats
       FROM tb_fortme_daily_usage du
       LEFT JOIN tb_fortme_votes v ON du.id_fortme_daily_usage = v.fk_daily_usage_id
       WHERE du.fk_id_features = ? 
       AND du.fk_group_id = ? 
       AND du.used_date = ?
       GROUP BY du.fk_id_user
       HAVING hearts > 0
       ORDER BY hearts DESC, hats ASC
       LIMIT 1`,
      [featureId, groupId, date]
    );
    
    // Mais odiado
    const mostHated = await query(
      `SELECT 
        du.fk_id_user as user_id,
        SUM(CASE WHEN v.vote = 'heart' THEN 1 ELSE 0 END) as hearts,
        SUM(CASE WHEN v.vote = 'hat' THEN 1 ELSE 0 END) as hats
       FROM tb_fortme_daily_usage du
       LEFT JOIN tb_fortme_votes v ON du.id_fortme_daily_usage = v.fk_daily_usage_id
       WHERE du.fk_id_features = ? 
       AND du.fk_group_id = ? 
       AND du.used_date = ?
       GROUP BY du.fk_id_user
       HAVING hats > 0
       ORDER BY hats DESC, hearts ASC
       LIMIT 1`,
      [featureId, groupId, date]
    );
    
    return {
      mostLoved: mostLoved.length > 0 ? mostLoved[0] : null,
      mostHated: mostHated.length > 0 ? mostHated[0] : null
    };
  } catch (error) {
    console.error('[DB] Erro ao buscar ranking amor/ódio:', error.message);
    return { mostLoved: null, mostHated: null };
  }
}

/**
 * Busca ranking tryhard do dia
 * @param {string} groupId 
 * @param {string} date 
 * @returns {Promise<object>} {mostTryhard, mostBanana}
 */
async function getTryhardRanking(groupId, date) {
  try {
    // Mais tryhard (maior porcentagem)
    const mostTryhard = await query(
      `SELECT 
        u.id_user as fk_id_user,
        COALESCE(du_firstname.value, 'Desconhecido') as first_name,
        d.percentage_value as tryhard,
        (100 - d.percentage_value) as banana
       FROM tb_fortme_daily_usage d
       INNER JOIN tb_user u ON u.id_user = d.fk_id_user
       LEFT JOIN tb_data_user du_firstname ON du_firstname.fk_id_user = u.id_user AND du_firstname.fk_id_metadata = 1
       WHERE d.fk_id_features = 4 
       AND d.fk_group_id = ? 
       AND d.used_date = ?
       AND d.percentage_value IS NOT NULL
       ORDER BY d.percentage_value DESC
       LIMIT 1`,
      [groupId, date]
    );
    
    // Mais banana (menor porcentagem)
    const mostBanana = await query(
      `SELECT 
        u.id_user as fk_id_user,
        COALESCE(du_firstname.value, 'Desconhecido') as first_name,
        d.percentage_value as tryhard,
        (100 - d.percentage_value) as banana
       FROM tb_fortme_daily_usage d
       INNER JOIN tb_user u ON u.id_user = d.fk_id_user
       LEFT JOIN tb_data_user du_firstname ON du_firstname.fk_id_user = u.id_user AND du_firstname.fk_id_metadata = 1
       WHERE d.fk_id_features = 4 
       AND d.fk_group_id = ? 
       AND d.used_date = ?
       AND d.percentage_value IS NOT NULL
       ORDER BY d.percentage_value ASC
       LIMIT 1`,
      [groupId, date]
    );
    
    return {
      mostTryhard: mostTryhard.length > 0 ? mostTryhard[0] : null,
      mostBanana: mostBanana.length > 0 ? mostBanana[0] : null
    };
  } catch (error) {
    console.error('[DB] Erro ao buscar ranking tryhard:', error.message);
    return { mostTryhard: null, mostBanana: null };
  }
}

/**
 * Busca ranking X1 (local ou global)
 * @param {string|null} groupId - null para ranking global
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getX1TopRanking(groupId = null, limit = 5) {
  try {
    let sql = `
      SELECT 
        s.fk_id_user as user_id,
        s.wins,
        s.duels_completed,
        s.tryhard,
        s.banana,
        ROUND((s.wins / NULLIF(s.duels_completed, 0)) * 100, 2) as win_rate
      FROM tb_fortme_user_stats s
    `;
    
    const params = [];
    
    if (groupId) {
      sql += ' WHERE s.fk_group_id = ?';
      params.push(groupId);
    }
    
    sql += ` 
      ORDER BY s.wins DESC, win_rate DESC, s.duels_completed DESC
      LIMIT ?
    `;
    params.push(limit);
    
    const result = await query(sql, params);
    return result;
  } catch (error) {
    console.error('[DB] Erro ao buscar ranking X1:', error.message);
    return [];
  }
}

// =====================================================
// DUELS - Funções adicionais para X1
// =====================================================

/**
 * Busca um duelo por ID
 * @param {number} duelId - ID do duelo
 * @returns {Promise<object|null>} Duelo encontrado ou null
 */
async function getDuelById(duelId) {
  try {
    const result = await query(
      'SELECT * FROM tb_fortme_duels WHERE id_fortme_duels = ?',
      [duelId]
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[DB] Erro ao buscar duelo:', error.message);
    return null;
  }
}

/**
 * Atualiza o status e vencedor de um duelo
 * @param {number} duelId - ID do duelo
 * @param {string} status - Status do duelo (completed, abandoned)
 * @param {number|null} winnerId - ID do vencedor ou null
 * @returns {Promise<boolean>} Sucesso ou falha
 */
async function updateDuel(duelId, status, winnerId) {
  try {
    await query(
      'UPDATE tb_fortme_duels SET status = ?, winner_id = ? WHERE id_fortme_duels = ?',
      [status, winnerId, duelId]
    );
    return true;
  } catch (error) {
    console.error('[DB] Erro ao atualizar duelo:', error.message);
    return false;
  }
}

/**
 * Salva uma jogada (move) de um duelo
 * @param {number} duelId - ID do duelo
 * @param {number} userId - ID do usuário
 * @param {string} move - Jogada (attack, defend, flee)
 * @param {number} moveOrder - Ordem da jogada (1, 2, 3)
 * @returns {Promise<boolean>} Sucesso ou falha
 */
async function saveDuelMove(duelId, userId, move, moveOrder) {
  try {
    await query(
      'INSERT INTO tb_duel_moves (fk_id_duel, fk_id_user, move, move_order) VALUES (?, ?, ?, ?)',
      [duelId, userId, move, moveOrder]
    );
    return true;
  } catch (error) {
    console.error('[DB] Erro ao salvar jogada:', error.message);
    return false;
  }
}

/**
 * Atualiza estatísticas de um usuário em um grupo
 * @param {number} userId - ID do usuário
 * @param {number} groupId - ID do grupo
 * @param {string} field - Campo a incrementar (wins, duels_started, duels_completed, duels_abandoned, tryhard, banana)
 * @param {number} increment - Valor a incrementar (padrão 1)
 * @returns {Promise<boolean>} Sucesso ou falha
 */
async function updateUserStats(userId, groupId, field, increment = 1) {
  try {
    const validFields = ['wins', 'duels_started', 'duels_completed', 'duels_abandoned', 'tryhard', 'banana'];
    if (!validFields.includes(field)) {
      throw new Error(`Campo inválido: ${field}`);
    }
    
    // Verificar se registro existe
    const existing = await query(
      'SELECT * FROM tb_fortme_user_stats WHERE fk_id_user = ? AND fk_group_id = ?',
      [userId, groupId]
    );
    
    if (existing.length > 0) {
      // Atualizar
      await query(
        `UPDATE tb_fortme_user_stats SET ${field} = ${field} + ? WHERE fk_id_user = ? AND fk_group_id = ?`,
        [increment, userId, groupId]
      );
    } else {
      // Criar
      await query(
        `INSERT INTO tb_fortme_user_stats (fk_id_user, fk_group_id, ${field}) VALUES (?, ?, ?)`,
        [userId, groupId, increment]
      );
    }
    
    return true;
  } catch (error) {
    console.error('[DB] Erro ao atualizar estatísticas:', error.message);
    return false;
  }
}

/**
 * Busca o percentual de tryhard de um usuário no dia atual
 * @param {number} userId - ID do usuário
 * @param {number} groupId - ID do grupo
 * @returns {Promise<number|null>} Percentual (0-100) ou null se não usou hoje
 */
async function getTryhardPercentage(userId, groupId) {
  try {
    const today = getCurrentDate();
    const result = await query(
      `SELECT percentage_value 
       FROM tb_fortme_daily_usage 
       WHERE fk_id_user = ? 
         AND fk_group_id = ? 
         AND fk_id_features = 4
         AND used_date = ?`,
      [userId, groupId, today]
    );
    
    return result.length > 0 && result[0].percentage_value !== null 
      ? parseFloat(result[0].percentage_value) 
      : null;
  } catch (error) {
    console.error('[DB] Erro ao buscar percentual tryhard:', error.message);
    return null;
  }
}

/**
 * Verifica se usuário já usou uma feature hoje
 * @param {number} userId - ID do usuário
 * @param {number} groupId - ID do grupo
 * @param {number} featureId - ID da feature
 * @returns {Promise<object|null>} Registro de uso ou null
 */
async function checkDailyUsage(userId, groupId, featureId) {
  try {
    const today = getCurrentDate();
    const result = await query(
      `SELECT * FROM tb_fortme_daily_usage 
       WHERE fk_id_user = ? 
         AND fk_group_id = ? 
         AND fk_id_features = ?
         AND used_date = ?`,
      [userId, groupId, featureId, today]
    );
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[DB] Erro ao verificar uso diário:', error.message);
    return null;
  }
}

/**
 * Salva uso diário de uma feature
 * @param {number} userId - ID do usuário
 * @param {number} groupId - ID do grupo
 * @param {number} featureId - ID da feature
 * @param {number|null} contentId - ID do conteúdo (pode ser null para tryhardme)
 * @param {number} messageId - ID da mensagem enviada
 * @param {number|null} percentageValue - Valor percentual (para tryhardme)
 * @returns {Promise<number|null>} ID do registro criado ou null
 */
async function saveDailyUsage(userId, groupId, featureId, contentId, messageId, percentageValue = null) {
  try {
    const today = getCurrentDate();
    
    // Se contentId for null, usar um valor padrão temporário (será ignorado pela aplicação)
    const finalContentId = contentId || 1; // Usa 1 como placeholder se não tiver conteúdo
    
    const result = await query(
      `INSERT INTO tb_fortme_daily_usage 
       (fk_id_user, fk_group_id, fk_id_features, fk_id_contents, message_id, used_date, percentage_value)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, groupId, featureId, finalContentId, messageId, today, percentageValue]
    );
    
    return result.insertId || null;
  } catch (error) {
    console.error('[DB] Erro ao salvar uso diário:', error.message);
    return null;
  }
}

// =====================================================
// X1 - Funções específicas para substituir JSON
// =====================================================

/**
 * Busca dados tryhard/banana do dia para um usuário
 * @param {string} groupId - ID do grupo
 * @param {string} userId - ID do usuário
 * @returns {Promise<object|null>} { tryhard: number, banana: number } ou null
 */
async function getDailyTryhardData(groupId, userId) {
  try {
    userId = BigInt(userId).toString();
    
    // Buscar na tb_fortme_user_stats
    const results = await query(
      `SELECT tryhard, banana 
       FROM tb_fortme_user_stats
       WHERE fk_id_user = ? AND fk_group_id = ?`,
      [userId, groupId]
    );
    
    if (results.length === 0 || (results[0].tryhard === 0 && results[0].banana === 0)) {
      return null;
    }
    
    return {
      tryhard: results[0].tryhard || 0,
      banana: results[0].banana || 0
    };
  } catch (error) {
    console.error('[DB] Erro ao buscar dados tryhard:', error.message);
    return null;
  }
}

/**
 * Salva uma vitória no ranking X1
 * @param {string} groupId - ID do grupo
 * @param {string|number} userId - ID do usuário
 * @param {string} userName - Nome do usuário
 * @returns {Promise<void>}
 */
async function saveX1Win(groupId, userId, userName) {
  try {
    userId = BigInt(userId).toString();
    
    // Garantir que o usuário existe na tb_user
    await ensureUser(userId, 1, { first_name: userName });
    
    // Verificar se já existe registro
    const existing = await query(
      `SELECT fk_id_user FROM tb_fortme_user_stats 
       WHERE fk_id_user = ? AND fk_group_id = ?`,
      [userId, groupId]
    );
    
    if (existing.length > 0) {
      // Incrementar vitórias
      await query(
        `UPDATE tb_fortme_user_stats 
         SET wins = wins + 1
         WHERE fk_id_user = ? AND fk_group_id = ?`,
        [userId, groupId]
      );
    } else {
      // Criar novo registro
      await query(
        `INSERT INTO tb_fortme_user_stats 
         (fk_id_user, fk_group_id, wins)
         VALUES (?, ?, 1)`,
        [userId, groupId]
      );
    }
    
    console.log(`[DB] ✓ Vitória X1 salva para ${userName} (${userId}) no grupo ${groupId}`);
  } catch (error) {
    console.error('[DB] Erro ao salvar vitória X1:', error.message);
    throw error;
  }
}

/**
 * Salva estatísticas de duelo
 * @param {string} groupId - ID do grupo
 * @param {string} type - Tipo: 'started', 'completed', 'abandoned', 'win'
 * @param {string|null} player1Id - ID do jogador 1
 * @param {string|null} player1Name - Nome do jogador 1
 * @param {string|null} player2Id - ID do jogador 2
 * @param {string|null} player2Name - Nome do jogador 2
 * @returns {Promise<void>}
 */
async function saveX1Statistics(groupId, type, player1Id = null, player1Name = null, player2Id = null, player2Name = null) {
  try {
    // Atualizar estatísticas dos jogadores na tb_fortme_user_stats
    const updatePlayerStats = async (playerId, playerName, statType) => {
      if (!playerId) return;
      
      playerId = BigInt(playerId).toString();
      
      // Garantir que o usuário existe na tb_user
      await ensureUser(playerId, 1, { first_name: playerName });
      
      // Verificar se jogador existe
      const existing = await query(
        `SELECT fk_id_user FROM tb_fortme_user_stats 
         WHERE fk_id_user = ? AND fk_group_id = ?`,
        [playerId, groupId]
      );
      
      if (existing.length > 0) {
        // Atualizar
        let updateField = '';
        if (statType === 'started') updateField = 'duels_started = duels_started + 1';
        else if (statType === 'completed') updateField = 'duels_completed = duels_completed + 1';
        else if (statType === 'abandoned') updateField = 'duels_abandoned = duels_abandoned + 1';
        else if (statType === 'win') updateField = 'wins = wins + 1';
        
        if (updateField) {
          await query(
            `UPDATE tb_fortme_user_stats SET ${updateField}
             WHERE fk_id_user = ? AND fk_group_id = ?`,
            [playerId, groupId]
          );
        }
      } else {
        // Criar novo
        const fields = {
          duels_started: statType === 'started' ? 1 : 0,
          duels_completed: statType === 'completed' ? 1 : 0,
          duels_abandoned: statType === 'abandoned' ? 1 : 0,
          wins: statType === 'win' ? 1 : 0
        };
        
        await query(
          `INSERT INTO tb_fortme_user_stats 
           (fk_id_user, fk_group_id, duels_started, duels_completed, duels_abandoned, wins)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [playerId, groupId, fields.duels_started, fields.duels_completed, fields.duels_abandoned, fields.wins]
        );
      }
    };
    
    // Aplicar estatísticas baseadas no tipo
    if (type === 'started' && player1Id && player2Id) {
      await updatePlayerStats(player1Id, player1Name, 'started');
      await updatePlayerStats(player2Id, player2Name, 'started');
    } else if (type === 'completed' && player1Id && player2Id) {
      await updatePlayerStats(player1Id, player1Name, 'completed');
      await updatePlayerStats(player2Id, player2Name, 'completed');
    } else if (type === 'abandoned') {
      if (player1Id) await updatePlayerStats(player1Id, player1Name, 'abandoned');
      if (player2Id) await updatePlayerStats(player2Id, player2Name, 'abandoned');
    } else if (type === 'win' && player1Id) {
      await updatePlayerStats(player1Id, player1Name, 'win');
    }
    
    console.log(`[DB] ✓ Estatísticas X1 salvas: ${type} no grupo ${groupId}`);
  } catch (error) {
    console.error('[DB] Erro ao salvar estatísticas X1:', error.message);
    throw error;
  }
}

/**
 * Cria um registro de duelo na tabela tb_fortme_duels
 * @param {string} groupId - ID do grupo
 * @param {string|number} challengerId - ID do desafiante
 * @param {string|number} opponentId - ID do oponente
 * @returns {Promise<number>} ID do duelo criado
 */
async function createDuelRecord(groupId, challengerId, opponentId) {
  try {
    challengerId = BigInt(challengerId).toString();
    opponentId = BigInt(opponentId).toString();
    groupId = BigInt(groupId).toString();
    
    const result = await query(
      `INSERT INTO tb_fortme_duels 
       (fk_group_id, challenger_id, opponent_id, status, is_tryhard) 
       VALUES (?, ?, ?, 'started', 0)`,
      [groupId, challengerId, opponentId]
    );
    
    console.log(`[DB] ✓ Duelo criado: ID ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error('[DB] Erro ao criar registro de duelo:', error.message);
    throw error;
  }
}

/**
 * Salva um movimento individual do duelo
 * @param {number} duelId - ID do duelo
 * @param {string|number} userId - ID do usuário
 * @param {string} move - Movimento realizado ('attack', 'defend', 'flee')
 * @param {number} moveOrder - Ordem do movimento (1 ou 2)
 * @returns {Promise<void>}
 */
async function saveDuelMove(duelId, userId, move, moveOrder) {
  try {
    userId = BigInt(userId).toString();
    
    await query(
      `INSERT INTO tb_duel_moves 
       (fk_id_duel, fk_id_user, move, move_order) 
       VALUES (?, ?, ?, ?)`,
      [duelId, userId, move, moveOrder]
    );
    
    console.log(`[DB] ✓ Movimento salvo: Duelo ${duelId}, User ${userId}, Move ${move}`);
  } catch (error) {
    console.error('[DB] Erro ao salvar movimento:', error.message);
    // Não lança erro - movimento é registro auxiliar
  }
}

/**
 * Atualiza o status e vencedor de um duelo
 * @param {number} duelId - ID do duelo
 * @param {string|number|null} winnerId - ID do vencedor (null se abandonado)
 * @param {string} status - Status do duelo ('completed', 'abandoned')
 * @returns {Promise<void>}
 */
async function updateDuelResult(duelId, winnerId, status) {
  try {
    if (winnerId) {
      winnerId = BigInt(winnerId).toString();
    }
    
    await query(
      `UPDATE tb_fortme_duels 
       SET winner_id = ?, status = ? 
       WHERE id_fortme_duels = ?`,
      [winnerId, status, duelId]
    );
    
    console.log(`[DB] ✓ Duelo ${duelId} atualizado: vencedor ${winnerId || 'nenhum'}, status ${status}`);
  } catch (error) {
    console.error('[DB] Erro ao atualizar resultado do duelo:', error.message);
    // Não lança erro
  }
}

module.exports = {
  // Database
  query,
  
  // Users
  ensureUser,
  updateUserMetadata,
  isAdmin,
  
  // Communities
  ensureCommunity,
  ensureBotGroup,
  updateMemberCount,
  getBroadcastGroups,
  
  // Contents
  getRandomContent,
  addContent,
  removeContent,
  
  // Daily Usage
  getDailyUsage,
  recordDailyUsage,
  getDailyRanking,
  checkDailyUsage,
  saveDailyUsage,
  
  // Votes
  recordVote,
  getVotes,
  
  // Duels
  createDuel,
  updateDuelStats,
  getX1Ranking,
  getDuelById,
  updateDuel,
  saveDuelMove,
  updateUserStats,
  getTryhardPercentage,
  
  // Broadcast
  saveBroadcastHistory,
  getBroadcastHistory,
  
  // Rankings
  getDailyLoveHateRanking,
  getTryhardRanking,
  getX1TopRanking,
  
  // Helpers
  getCurrentDate,
  isGroupCommand,
  getGroupInfo,
  getUserInfo,
  
  // X1 (JSON replacement)
  getDailyTryhardData,
  saveX1Win,
  saveX1Statistics,
  createDuelRecord,
  saveDuelMove,
  updateDuelResult,
  updateDuelStats // Renomear updateDuelStats -> já estava exportado
};

