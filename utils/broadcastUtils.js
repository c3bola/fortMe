const { ensureBotGroup } = require('./databaseUtilsMySQL');

/**
 * Registra grupo para broadcast (wrapper para manter compatibilidade)
 * @param {object} ctx - Contexto do Telegraf
 */
async function ensureGroupInBroadcast(ctx) {
  if (!ctx.chat || ctx.chat.type === 'private') return;
  
  const groupId = ctx.chat.id.toString();
  const groupName = ctx.chat.title || 'Grupo sem nome';
  
  await ensureBotGroup(groupId, groupName);
}

module.exports = { ensureGroupInBroadcast };
