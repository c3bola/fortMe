'use strict';

const { query } = require('../../../database/dbConnection');

async function checkAdminPermission(userId) {
  const result = await query(
    'SELECT fk_id_profile FROM tb_user WHERE id_user = ?',
    [String(userId)]
  );

  if (result.length === 0) {
    return { isAdmin: false, isSuperAdmin: false, profile: 0 };
  }

  const profile = result[0].fk_id_profile;
  return {
    isAdmin: profile === 4 || profile === 5,
    isSuperAdmin: profile === 4,
    profile
  };
}

module.exports = { checkAdminPermission };