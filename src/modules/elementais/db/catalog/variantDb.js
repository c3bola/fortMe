'use strict';
const { query } = require('../../../../database/dbConnection');

async function createVariant(spriteId, categoryId, location, summonCost, dropChance, imagePath) {
  const result = await query(
    `INSERT INTO tb_elemental_variant 
     (fk_id_sprite, fk_id_category, location, summon_cost, drop_chance, image, is_active) 
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [spriteId, categoryId, location, summonCost, dropChance, imagePath]
  );
  return result.insertId;
}

async function getAllVariants() {
  return await query(
    `SELECT v.*, s.slug, s.name AS sprite_name, s.description AS sprite_description,
            c.code AS category_code, c.name AS category_name, c.display_order AS category_order,
            r.name AS rarity_name, r.color AS rarity_color
     FROM tb_elemental_variant v
     JOIN tb_elemental_sprite s ON v.fk_id_sprite = s.id_elemental_sprite
     JOIN tb_elemental_category c ON v.fk_id_category = c.id_elemental_category
     LEFT JOIN tb_elemental_rarity r ON v.fk_id_rarity = r.id_elemental_rarity
     JOIN tb_elemental_season_variant sv ON v.id_elemental_variant = sv.fk_id_variant
     JOIN tb_elemental_season season ON sv.fk_id_season = season.id_season
     WHERE v.is_active = 1 AND s.is_active = 1 AND c.is_active = 1
       AND sv.is_active = 1 AND season.is_current = 1
     ORDER BY c.display_order ASC, s.display_order ASC`
  );
}

async function getVariantsByCategory(categoryId) {
  return await query(
    `SELECT v.*, s.slug, s.name AS sprite_name, s.description AS sprite_description, s.display_order AS sprite_order,
            r.name AS rarity_name, r.color AS rarity_color
     FROM tb_elemental_variant v
     JOIN tb_elemental_sprite s ON v.fk_id_sprite = s.id_elemental_sprite
     LEFT JOIN tb_elemental_rarity r ON v.fk_id_rarity = r.id_elemental_rarity
     JOIN tb_elemental_season_variant sv ON v.id_elemental_variant = sv.fk_id_variant
     JOIN tb_elemental_season season ON sv.fk_id_season = season.id_season
     WHERE v.fk_id_category = ? 
       AND v.is_active = 1 AND s.is_active = 1 AND sv.is_active = 1 AND season.is_current = 1
     ORDER BY s.display_order ASC, s.name ASC`,
    [categoryId]
  );
}

async function getVariantById(variantId) {
  const result = await query(
    `SELECT v.*, s.slug, s.name AS sprite_name, s.description AS sprite_description,
            c.code AS category_code, c.name AS category_name,
            r.name AS rarity_name, r.color AS rarity_color
     FROM tb_elemental_variant v
     JOIN tb_elemental_sprite s ON v.fk_id_sprite = s.id_elemental_sprite
     JOIN tb_elemental_category c ON v.fk_id_category = c.id_elemental_category
     LEFT JOIN tb_elemental_rarity r ON v.fk_id_rarity = r.id_elemental_rarity
     JOIN tb_elemental_season_variant sv ON v.id_elemental_variant = sv.fk_id_variant
     JOIN tb_elemental_season season ON sv.fk_id_season = season.id_season
     WHERE v.id_elemental_variant = ?
      AND v.is_active = 1 AND s.is_active = 1 AND c.is_active = 1
      AND sv.is_active = 1 AND season.is_current = 1`,
    [variantId]
  );
  return result.length > 0 ? result[0] : null;
}

async function getVariantsBySpriteId(spriteId) {
  return await query(
    `SELECT v.*, c.code AS category_code, c.name AS category_name, c.display_order AS category_order,
            r.name AS rarity_name, r.color AS rarity_color
     FROM tb_elemental_variant v
     JOIN tb_elemental_category c ON v.fk_id_category = c.id_elemental_category
     LEFT JOIN tb_elemental_rarity r ON v.fk_id_rarity = r.id_elemental_rarity
     JOIN tb_elemental_season_variant sv ON v.id_elemental_variant = sv.fk_id_variant
     JOIN tb_elemental_season season ON sv.fk_id_season = season.id_season
     WHERE v.fk_id_sprite = ? AND v.is_active = 1 AND sv.is_active = 1 AND season.is_current = 1
     ORDER BY c.display_order ASC`,
    [spriteId]
  );
}

async function getVariantsBySpriteIdAdmin(spriteId) {
  return await query(
    `SELECT v.id_elemental_variant, c.name AS cat_name, c.code AS cat_code, v.is_active 
     FROM tb_elemental_variant v
     JOIN tb_elemental_category c ON v.fk_id_category = c.id_elemental_category
     WHERE v.fk_id_sprite = ?
     ORDER BY c.display_order ASC`,
    [spriteId]
  );
}

async function updateVariantImage(variantId, imagePath) {
  await query('UPDATE tb_elemental_variant SET image = ? WHERE id_elemental_variant = ?', [imagePath, variantId]);
}

async function updateVariantCache(variantId, fileId, uniqueId) {
  await query(
    'UPDATE tb_elemental_variant SET telegram_file_id = ?, telegram_file_unique_id = ? WHERE id_elemental_variant = ?', 
    [fileId, uniqueId, variantId]
  );
}

async function updateVariantData(variantId, location, cost, chance, imagePath) {
  await query(
    `UPDATE tb_elemental_variant SET location = ?, summon_cost = ?, drop_chance = ?, image = ?, telegram_file_id = NULL, telegram_file_unique_id = NULL WHERE id_elemental_variant = ?`,
    [location, cost, chance, imagePath, variantId]
  );
}

async function toggleVariantStatus(variantId) {
  await query('UPDATE tb_elemental_variant SET is_active = 1 - is_active WHERE id_elemental_variant = ?', [variantId]);
  const vInfo = await query('SELECT is_active FROM tb_elemental_variant WHERE id_elemental_variant = ?', [variantId]);
  const isNowActive = vInfo[0].is_active === 1;

  const currentSeason = await query('SELECT id_season FROM tb_elemental_season WHERE is_current = 1 LIMIT 1');
  if (currentSeason.length > 0) {
    await query(
      `INSERT INTO tb_elemental_season_variant (fk_id_season, fk_id_variant, is_active)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)`,
      [currentSeason[0].id_season, variantId, isNowActive ? 1 : 0]
    );
  }
}

module.exports = {
  createVariant, getAllVariants, getVariantsByCategory, getVariantById, 
  getVariantsBySpriteId, getVariantsBySpriteIdAdmin, updateVariantImage, 
  updateVariantCache, updateVariantData, toggleVariantStatus
};