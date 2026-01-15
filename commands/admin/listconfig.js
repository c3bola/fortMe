const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config/config.json');

module.exports = (bot) => {
  bot.command('listconfig', (ctx) => {
    // Ler o arquivo de configuração
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de configuração.');
    }

    // Construir a mensagem com formatação HTML
    const configMessage = `
<b>📋 Configurações Atuais:</b>

<b>🔑 API Key:</b> <code>${config.apiKey}</code>

<b>👑 Administradores:</b>
${config.admins.map(admin => `- <b>${admin.name}</b> (ID: <code>${admin.id}</code>)`).join('\n')}

<b>📢 Grupo de Logs:</b>
- <b>Nome:</b> ${config.logGroup.name}
- <b>Status:</b> ${config.logGroup.status ? 'Ativo ✅' : 'Inativo ❌'}
- <b>ID:</b> <code>${config.logGroup.id}</code>
- <b>Tópico:</b> <code>${config.logGroup.topic || 'Nenhum'}</code>

<b>⏰ Crons Configurados:</b>
${Object.entries(config.cronJobs).map(([cronName, cronConfig]) => `
- <b>${cronName}:</b>
  - <b>Status:</b> ${cronConfig.status ? 'Ativo ✅' : 'Inativo ❌'}
  - <b>Agendamento:</b> <code>${cronConfig.schedule}</code>
`).join('\n')}

<b>🏠 Grupos Registrados:</b>
// Grupos do broadcast.json
(() => {
  const fs = require('fs');
  const path = require('path');
  const broadcastPath = path.join(__dirname, '../../database/broadcast.json');
  let broadcastGroups = [];
  if (fs.existsSync(broadcastPath)) {
    const broadcastData = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
    if (broadcastData.groups) {
      broadcastGroups = Object.values(broadcastData.groups);
    }
  }
  return broadcastGroups.map(group => `- <b>ID:</b> <code>${group.id}</code> (<b>Nome:</b> ${group.name || 'Sem nome'})`).join('\n');
})()

<b>⚙️ Comandos Ativos:</b>
${Object.entries(config.commands).map(([command, status]) => `- <b>${command}:</b> ${status ? 'Ativo ✅' : 'Inativo ❌'}`).join('\n')}
    `.trim();

    // Enviar a mensagem formatada
    ctx.reply(configMessage, { parse_mode: 'HTML' });
  });
};
