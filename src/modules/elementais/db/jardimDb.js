'use strict';

const { query } = require('../../../database/dbConnection');

async function getUserSeasonsProgress(userId) {
  userId = BigInt(userId).toString();

  const seasons = await query('SELECT * FROM tb_elemental_season ORDER BY chapter ASC, season_number ASC, id_season ASC');
  const progressList = [];

  for (const season of seasons) {
    const stats = await query(
      `SELECT 
         COUNT(sv.fk_id_variant) AS total_available,
         COUNT(c.fk_id_variant) AS total_owned,
         SUM(CASE WHEN c.is_dominated = 1 THEN 1 ELSE 0 END) AS total_dominated
       FROM tb_elemental_season_variant sv
       INNER JOIN tb_elemental_variant v 
         ON sv.fk_id_variant = v.id_elemental_variant
       LEFT JOIN tb_elemental_collection c
         ON sv.fk_id_variant = c.fk_id_variant
        AND c.fk_id_user = ?
        AND (c.fk_id_season = sv.fk_id_season OR c.fk_id_season = 0)
       WHERE sv.fk_id_season = ?`,
      [userId, season.id_season]
    );

    const totalAvailable = parseInt(stats[0]?.total_available) || 0;
    const totalOwned = parseInt(stats[0]?.total_owned) || 0;
    const totalDominated = parseInt(stats[0]?.total_dominated) || 0;
    const percentOwned = totalAvailable > 0 ? (totalOwned / totalAvailable) * 100 : 0;
    const isFullDominated = totalAvailable > 0 && totalDominated === totalAvailable;

    let medalKey = 'default';
    if (totalAvailable === 0) {
      medalKey = 'default';
    } else if (percentOwned === 100 && isFullDominated) {
      medalKey = 'platinum'; 
    } else if (percentOwned === 100) {
      medalKey = 'gold';     
    } else if (percentOwned >= 80) {
      medalKey = 'silver';   
    } else if (percentOwned >= 70) {
      medalKey = 'bronze';   
    }

    progressList.push({
      season,
      totalAvailable,
      totalOwned,
      totalDominated,
      percentOwned,
      medalKey
    });
  }

  return progressList;
}

async function getActiveSeasonMetrics(userId) {
  userId = BigInt(userId).toString();

  const activeSeason = await query('SELECT * FROM tb_elemental_season WHERE is_current = 1 LIMIT 1');
  if (activeSeason.length === 0) return null;

  const season = activeSeason[0];

  const domStats = await query(
    `SELECT COUNT(*) AS total 
     FROM tb_elemental_collection c
     JOIN tb_elemental_season_variant sv ON c.fk_id_variant = sv.fk_id_variant
     WHERE c.fk_id_user = ?
       AND c.is_dominated = 1
       AND (c.fk_id_season = sv.fk_id_season OR c.fk_id_season = 0)
       AND sv.fk_id_season = ?`,
    [userId, season.id_season]
  );

  const helpStats = await query(
    `SELECT COUNT(*) AS total 
     FROM tb_elemental_help_log 
     WHERE fk_helper_id = ? AND fk_id_season = ?`,
    [userId, season.id_season]
  );

  return {
    seasonName: season.name,
    totalDominated: parseInt(domStats[0].total) || 0,
    totalHelped: parseInt(helpStats[0].total) || 0
  };
}

module.exports = {
  getUserSeasonsProgress,
  getActiveSeasonMetrics
};