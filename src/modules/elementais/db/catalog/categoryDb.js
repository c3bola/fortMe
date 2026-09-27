'use strict';
const { query } = require('../../../../database/dbConnection');

async function getElementalCategories() {
  return await query('SELECT * FROM tb_elemental_category WHERE is_active = 1 ORDER BY display_order ASC');
}

async function getCategoryByCode(code) {
  const result = await query('SELECT * FROM tb_elemental_category WHERE code = ? AND is_active = 1', [code]);
  return result.length > 0 ? result[0] : null;
}

async function getAllCategories() {
  return await query('SELECT id_elemental_category, code, name, is_active FROM tb_elemental_category ORDER BY display_order ASC');
}

async function toggleCategoryStatus(categoryId) {
  await query('UPDATE tb_elemental_category SET is_active = 1 - is_active WHERE id_elemental_category = ?', [categoryId]);
}

module.exports = {
  getElementalCategories,
  getCategoryByCode,
  getAllCategories,
  toggleCategoryStatus
};