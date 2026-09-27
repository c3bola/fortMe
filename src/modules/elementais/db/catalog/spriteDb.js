'use strict';
const { query } = require('../../../../database/dbConnection');

async function getSpriteBySlug(slug) {
  const result = await query('SELECT * FROM tb_elemental_sprite WHERE slug = ? AND is_active = 1', [slug]);
  return result.length > 0 ? result[0] : null;
}

async function createSprite(slug, name, description) {
  const result = await query(
    'INSERT INTO tb_elemental_sprite (slug, name, description, is_active) VALUES (?, ?, ?, 1)', 
    [slug, name, description]
  );
  return result.insertId;
}

async function getSpritesByName(name) {
  return await query(
    `SELECT DISTINCT s.* 
     FROM tb_elemental_sprite s
     JOIN tb_elemental_variant v ON s.id_elemental_sprite = v.fk_id_sprite
     JOIN tb_elemental_season_variant sv ON v.id_elemental_variant = sv.fk_id_variant
     JOIN tb_elemental_season season ON sv.fk_id_season = season.id_season
     WHERE s.name LIKE ? 
       AND s.is_active = 1 AND v.is_active = 1 AND sv.is_active = 1 AND season.is_current = 1
     ORDER BY CASE WHEN LOWER(s.name) = LOWER(?) THEN 0 ELSE 1 END, s.display_order ASC, s.name ASC
     LIMIT 10`,
    [`%${name}%`, name]
  );
}

async function updateSpriteDescription(spriteId, description) {
  await query('UPDATE tb_elemental_sprite SET description = ? WHERE id_elemental_sprite = ?', [description, spriteId]);
}

async function getAllSpritesAdmin() {
  return await query('SELECT id_elemental_sprite, name, is_active FROM tb_elemental_sprite ORDER BY display_order ASC, name ASC');
}

async function getSpriteNameById(spriteId) {
  const result = await query('SELECT name FROM tb_elemental_sprite WHERE id_elemental_sprite = ?', [spriteId]);
  return result.length > 0 ? result[0].name : 'Elemental';
}

async function toggleSpriteStatus(spriteId) {
  await query('UPDATE tb_elemental_sprite SET is_active = 1 - is_active WHERE id_elemental_sprite = ?', [spriteId]);
  const sprInfo = await query('SELECT is_active FROM tb_elemental_sprite WHERE id_elemental_sprite = ?', [spriteId]);
  const newStatus = sprInfo[0].is_active;

  // EFEITO CASCATA transferido do comando para o repositório
  if (newStatus === 1) {
    await query('UPDATE tb_elemental_variant SET is_active = 1 WHERE fk_id_sprite = ?', [spriteId]);
    const currentSeason = await query('SELECT id_season FROM tb_elemental_season WHERE is_current = 1 LIMIT 1');
    if (currentSeason.length > 0) {
      await query(`
        INSERT INTO tb_elemental_season_variant (fk_id_season, fk_id_variant, is_active)
        SELECT ?, id_elemental_variant, 1 FROM tb_elemental_variant WHERE fk_id_sprite = ?
        ON DUPLICATE KEY UPDATE is_active = 1
      `, [currentSeason[0].id_season, spriteId]);
    }
  } else {
    await query('UPDATE tb_elemental_variant SET is_active = 0 WHERE fk_id_sprite = ?', [spriteId]);
  }
}

module.exports = {
  getSpriteBySlug, createSprite, getSpritesByName, 
  updateSpriteDescription, getAllSpritesAdmin, getSpriteNameById, toggleSpriteStatus
};