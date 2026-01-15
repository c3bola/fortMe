const fs = require('fs');
const path = require('path');
const config = require('../../config/config');


const files = {
  jonesy: path.join(__dirname, '../../database/fortjonesy.json'),
  fortgirls: path.join(__dirname, '../../database/fortgirl.json'),
  fortme: path.join(__dirname, '../../database/fortme.json'),
};
const configPath = path.join(__dirname, '../../config/config.json');
const broadcastPath = path.join(__dirname, '../../database/broadcast.json');

module.exports = (bot) => {
  bot.command('list', async (ctx) => {
    console.log('[LIST] Comando /list recebido');
    // Apenas administradores
    if (!config.admins.some(admin => admin.id === ctx.from.id)) {
      return ctx.reply('Apenas administradores podem usar este comando.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    const param = args[0]?.toLowerCase();
    if (!param) {
      return ctx.reply('Uso: /list admin|group|config|jonesy|fortgirls|fortme');
    }

    if (param === 'admin') {
      let config;
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        return ctx.reply('Erro ao acessar o arquivo de configuração.');
      }
      if (!config.admins || config.admins.length === 0) {
        return ctx.reply('Nenhum administrador registrado.');
      }
      let text = '<b>Administradores:</b>\n\n';
      const buttons = [];
      config.admins.forEach((admin, i) => {
        text += `${i + 1} - ${admin.name} (ID: <code>${admin.id}</code>)\n`;
        // Botão para remover admin, exceto o próprio
        if (admin.id !== ctx.from.id) {
          buttons.push([
            { text: `Remover ${admin.name}`, callback_data: `remove_admin_${admin.id}` }
          ]);
        } else {
          buttons.push([
            { text: `Você (${admin.name})`, callback_data: 'noop' }
          ]);
        }
      });
      return ctx.reply(text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    }
// Handler para remoção de admin via botão
module.exports = (bot) => {
  bot.command('list', async (ctx) => { /* ...existing code... */ });

  bot.action(/remove_admin_(\d+)/, async (ctx) => {
    const adminId = parseInt(ctx.match[1], 10);
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      return ctx.answerCbQuery('Erro ao acessar o arquivo de configuração.');
    }
    // Não permitir remover a si mesmo
    if (adminId === ctx.from.id) {
      return ctx.answerCbQuery('Você não pode se remover.');
    }
    const index = config.admins.findIndex(a => a.id === adminId);
    if (index === -1) {
      return ctx.answerCbQuery('Administrador não encontrado.');
    }
    const removed = config.admins.splice(index, 1)[0];
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      return ctx.answerCbQuery('Erro ao salvar a configuração.');
    }
    await ctx.editMessageText(`Administrador removido: <b>${removed.name}</b> (ID: <code>${removed.id}</code>)`, { parse_mode: 'HTML' });
    ctx.answerCbQuery('Administrador removido com sucesso.');
  });
};

    if (param === 'group') {
      if (!fs.existsSync(broadcastPath)) {
        return ctx.reply('Nenhum grupo registrado.');
      }
      const broadcastData = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
      const groups = Object.values(broadcastData.groups || {});
      if (groups.length === 0) {
        return ctx.reply('Nenhum grupo registrado.');
      }
      let text = '<b>Grupos registrados:</b>\n\n';
      groups.forEach((group, i) => {
        let link = '';
        if (group.username) {
          link = `https://t.me/${group.username}`;
        } else if (group.id && group.id.toString().startsWith('-100')) {
          link = `https://t.me/c/${group.id.toString().slice(4)}`;
        }
        text += link
          ? `${i + 1} - <a href="${link}">${group.name}</a>\n`
          : `${i + 1} - ${group.name}\n`;
      });
      return ctx.reply(text, { parse_mode: 'HTML', disable_web_page_preview: true });
    }

    if (param === 'config') {
      // Exibir as configurações detalhadas e formatadas
      let config;
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        return ctx.reply('Erro ao acessar o arquivo de configuração.');
      }
      let text = '<b>📋 Configurações Atuais:</b>\n';
      text += '\n<pre>🔑 API Key: ' + (config.apiKey ? config.apiKey : '') + '</pre>\n';
      text += '\n<b>👑 Administradores:</b>\n';
      config.admins.forEach(admin => {
        text += `- ${admin.name} (ID: ${admin.id})\n`;
      });
      text += '\n<b>📢 Grupo de Logs:</b>\n';
      if (config.logGroup) {
        text += `- Nome: ${config.logGroup.name || '-'}\n`;
        text += `- Status: ${config.logGroup.status ? 'Ativo ✅' : 'Inativo ❌'}\n`;
        text += `- ID: ${config.logGroup.id || '-'}\n`;
        text += `- Tópico: ${config.logGroup.topic || '-'}\n`;
      } else {
        text += '- Não configurado\n';
      }
      text += '\n<b>⏰ Crons Configurados:</b>\n';
      if (config.cronJobs && Object.keys(config.cronJobs).length > 0) {
        Object.entries(config.cronJobs).forEach(([cron, data]) => {
          text += `\n- ${cron}:\n  - Status: ${data.status ? 'Ativo ✅' : 'Inativo ❌'}\n  - Agendamento: ${data.schedule}\n`;
        });
      } else {
        text += '- Nenhum cron configurado\n';
      }
      text += '\n<b>🏠 Grupos Registrados:</b>\n';
      // Carregar grupos do broadcast.json
      let broadcastGroups = [];
      const broadcastPath = path.join(__dirname, '../../database/broadcast.json');
      if (fs.existsSync(broadcastPath)) {
        const broadcastData = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
        if (broadcastData.groups) {
          broadcastGroups = Object.values(broadcastData.groups);
        }
      }
      if (broadcastGroups.length > 0) {
        broadcastGroups.forEach(g => {
          text += `- ID: ${g.id} (Nome: ${g.name || 'Sem nome'})\n`;
        });
      } else {
        text += '- Nenhum grupo registrado\n';
      }
      text += '\n<b>⚙️ Comandos Ativos:</b>\n';
      if (config.commands) {
        Object.entries(config.commands).forEach(([cmd, status]) => {
          text += `- ${cmd}: ${status ? 'Ativo ✅' : 'Inativo ❌'}\n`;
        });
      }
      return ctx.reply(text.trim(), { parse_mode: 'HTML' });
    }

    // Itens dos arquivos JSON
    let key = param;
    if (key === 'fortgirls') key = 'fortgirls';
    if (key === 'fortme') key = 'fortme';
    if (key === 'jonesy') key = 'jonesy';
    const filePath = files[key];
    if (!filePath || !fs.existsSync(filePath)) {
      return ctx.reply('Arquivo de dados não encontrado.');
    }
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return ctx.reply('Erro ao ler o arquivo de dados.');
    }
    if (!Array.isArray(data) || data.length === 0) {
      return ctx.reply('Nenhum item encontrado.');
    }
    let text = `<b>Lista de ${param}:</b>\n\n`;
    data.forEach(item => {
      text += `${item.id} - ${item.name || item.text || 'Sem nome'}\n`;
    });
    ctx.reply(text, { parse_mode: 'HTML' });
  });
};
