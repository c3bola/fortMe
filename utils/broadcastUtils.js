const fs = require('fs');
const path = require('path');
const broadcastPath = path.join(__dirname, '../database/broadcast.json');

function ensureGroupInBroadcast(ctx) {
  if (!ctx.chat || ctx.chat.type === 'private') return;
  let broadcastData = { groups: {} };
  if (fs.existsSync(broadcastPath)) {
    try {
      broadcastData = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
    } catch (e) {
      console.error('[BROADCAST] Erro ao ler broadcast.json:', e.message);
    }
  }
  if (!broadcastData.groups) broadcastData.groups = {};
  const groupId = ctx.chat.id.toString();
  if (!broadcastData.groups[groupId]) {
    broadcastData.groups[groupId] = {
      id: groupId,
      name: ctx.chat.title || 'Grupo sem nome'
    };
    try {
      fs.writeFileSync(broadcastPath, JSON.stringify(broadcastData, null, 2), 'utf8');
      console.log(`[BROADCAST] Grupo registrado: ${groupId} - ${ctx.chat.title}`);
    } catch (e) {
      console.error('[BROADCAST] Erro ao salvar broadcast.json:', e.message);
    }
  }
}

module.exports = { ensureGroupInBroadcast };
