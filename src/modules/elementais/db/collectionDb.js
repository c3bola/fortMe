'use strict';

const { query, transaction } = require('../../../database/dbConnection');

async function getCurrentSeasonId() {
  const result = await query('SELECT id_season FROM tb_elemental_season WHERE is_current = 1 LIMIT 1');
  if (result.length === 0) throw new Error('Nenhuma temporada ativa encontrada.');
  return result[0].id_season;
}

async function getUserCollectionIds(userId) {
  userId = BigInt(userId).toString();
  const seasonId = await getCurrentSeasonId();

  const result = await query(
    'SELECT fk_id_variant FROM tb_elemental_collection WHERE fk_id_user = ? AND (fk_id_season = ? OR fk_id_season = 0)',
    [userId, seasonId]
  );
  return new Set(result.map(r => r.fk_id_variant));
}

async function getUserDominatedIds(userId) {
  userId = BigInt(userId).toString();
  const seasonId = await getCurrentSeasonId();

  const result = await query(
    'SELECT fk_id_variant FROM tb_elemental_collection WHERE fk_id_user = ? AND is_dominated = 1 AND (fk_id_season = ? OR fk_id_season = 0)',
    [userId, seasonId]
  );
  return new Set(result.map(r => r.fk_id_variant));
}

async function hasVariantInCollection(userId, variantId) {
  userId = BigInt(userId).toString();
  const seasonId = await getCurrentSeasonId();

  const result = await query(
    'SELECT id_elemental_collection FROM tb_elemental_collection WHERE fk_id_user = ? AND fk_id_variant = ? AND (fk_id_season = ? OR fk_id_season = 0)',
    [userId, variantId, seasonId]
  );
  return result.length > 0;
}

async function toggleVariantInCollection(userId, variantId) {
  userId = BigInt(userId).toString();
  return transaction(async (connection) => {
    const [seasonRows] = await connection.execute(
      'SELECT id_season FROM tb_elemental_season WHERE is_current = 1 LIMIT 1 FOR UPDATE'
    );
    if (seasonRows.length === 0) throw new Error('Nenhuma temporada ativa encontrada.');

    const seasonId = seasonRows[0].id_season;
    const [collectionRows] = await connection.execute(
      'SELECT id_elemental_collection FROM tb_elemental_collection WHERE fk_id_user = ? AND fk_id_variant = ? AND (fk_id_season = ? OR fk_id_season = 0) FOR UPDATE',
      [userId, variantId, seasonId]
    );

    if (collectionRows.length > 0) {
      await connection.execute(
        'DELETE FROM tb_elemental_collection WHERE id_elemental_collection = ?',
        [collectionRows[0].id_elemental_collection]
      );
      return false;
    }

    await connection.execute(
      'INSERT INTO tb_elemental_collection (fk_id_user, fk_id_variant, fk_id_season) VALUES (?, ?, ?)',
      [userId, variantId, seasonId]
    );
    return true;
  });
}

async function toggleVariantDomination(userId, variantId) {
  userId = BigInt(userId).toString();
  return transaction(async (connection) => {
    const [seasonRows] = await connection.execute(
      'SELECT id_season FROM tb_elemental_season WHERE is_current = 1 LIMIT 1 FOR UPDATE'
    );
    if (seasonRows.length === 0) throw new Error('Nenhuma temporada ativa encontrada.');

    const seasonId = seasonRows[0].id_season;
    const [result] = await connection.execute(
      'SELECT id_elemental_collection, is_dominated FROM tb_elemental_collection WHERE fk_id_user = ? AND fk_id_variant = ? AND (fk_id_season = ? OR fk_id_season = 0) FOR UPDATE',
      [userId, variantId, seasonId]
    );

    if (result.length === 0) throw new Error('NOT_IN_COLLECTION');

    const currentStatus = result[0].is_dominated;
    const newStatus = (currentStatus === 1 || currentStatus === true) ? 0 : 1;
    await connection.execute(
      'UPDATE tb_elemental_collection SET is_dominated = ? WHERE id_elemental_collection = ?',
      [newStatus, result[0].id_elemental_collection]
    );
    return newStatus === 1;
  });
}

async function getUserCollectionProgress(userId) {
  userId = BigInt(userId).toString();
  const seasonId = await getCurrentSeasonId();

  const [ownedResult, totalResult] = await Promise.all([
    query(
      `SELECT COUNT(c.fk_id_variant) AS total 
       FROM tb_elemental_collection c
       JOIN tb_elemental_season_variant sv ON c.fk_id_variant = sv.fk_id_variant
       WHERE c.fk_id_user = ? 
         AND (c.fk_id_season = ? OR c.fk_id_season = 0)
         AND sv.is_active = 1 
         AND sv.fk_id_season = ?`,
      [userId, seasonId, seasonId]
    ),
    query(
      `SELECT COUNT(*) AS total 
       FROM tb_elemental_season_variant sv
       JOIN tb_elemental_variant v ON sv.fk_id_variant = v.id_elemental_variant
       WHERE sv.is_active = 1 
         AND v.is_active = 1 
         AND sv.fk_id_season = ?`,
      [seasonId]
    )
  ]);

  const total_owned     = parseInt(ownedResult[0].total) || 0;
  const total_available = parseInt(totalResult[0].total) || 0;
  const percentage = total_available > 0
    ? parseFloat(((total_owned / total_available) * 100).toFixed(1))
    : 0;

  return { total_owned, total_available, percentage };
}

module.exports = {
  getUserCollectionIds,
  getUserDominatedIds,
  hasVariantInCollection,
  toggleVariantInCollection,
  toggleVariantDomination,
  getUserCollectionProgress
};