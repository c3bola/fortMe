'use strict';

const { query, sorteiosPool } = require('../../../database/dbConnection');

async function getAllCovers() {
  return await query('SELECT * FROM tb_elemental_cover ORDER BY is_default DESC, id_cover ASC');
}

async function addGlobalCover(fileId, name) {
  const result = await query(
    'INSERT INTO tb_elemental_cover (file_id, name, is_default) VALUES (?, ?, 0)',
    [fileId, name]
  );
  return result.insertId;
}

async function setGlobalDefaultCover(coverId) {
  await query('UPDATE tb_elemental_cover SET is_default = 0');
  await query('UPDATE tb_elemental_cover SET is_default = 1 WHERE id_cover = ?', [coverId]);
}

async function setUserCustomCover(userId, fileId) {
  const uid = BigInt(userId).toString();
  const existing = await query('SELECT * FROM tb_elemental_user_config WHERE fk_id_user = ?', [uid]);
  if (existing.length === 0) {
    await query('INSERT INTO tb_elemental_user_config (fk_id_user) VALUES (?)', [uid]);
  }
  
  await query(
    'UPDATE tb_elemental_user_config SET custom_cover_file_id = ?, updated_at = NOW() WHERE fk_id_user = ?',
    [fileId, uid]
  );
}

async function hasActiveSubscription(userId) {
  const uid = BigInt(userId).toString();
  const CLUBINHO_GROUP_ID = '-1001801600131';

  try {
    const [rows] = await sorteiosPool.query(
      `SELECT idSubscription 
       FROM tbSubscription 
       WHERE fkIdUser = ? 
         AND fkIdGroup = ? 
         AND statusSubscription = 'active' 
         AND endDate >= CURDATE() 
       LIMIT 1`,
      [uid, CLUBINHO_GROUP_ID]
    );
    
    return rows.length > 0;
  } catch (error) {
    console.error('[ERRO] Falha ao checar assinatura no banco fnbr_sorteios:', error.message);
    return false;
  }
}

async function getEffectiveCover(userId, isVip = false) {
  const uid = BigInt(userId).toString();
  
  if (isVip) {
    const userConf = await query('SELECT custom_cover_file_id FROM tb_elemental_user_config WHERE fk_id_user = ?', [uid]);
    if (userConf.length > 0 && userConf[0].custom_cover_file_id) {
      return userConf[0].custom_cover_file_id;
    }
  }
  
  const defCover = await query('SELECT file_id FROM tb_elemental_cover WHERE is_default = 1 LIMIT 1');
  if (defCover.length > 0 && defCover[0].file_id) {
    return defCover[0].file_id;
  }
  
  const fallback = await query('SELECT file_id FROM tb_elemental_cover LIMIT 1');
  if (fallback.length > 0 && fallback[0].file_id) {
    return fallback[0].file_id;
  }
  
  return null;
}

module.exports = {
  getAllCovers,
  addGlobalCover,
  setGlobalDefaultCover,
  setUserCustomCover,
  hasActiveSubscription,
  getEffectiveCover
};