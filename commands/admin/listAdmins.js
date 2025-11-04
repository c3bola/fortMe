const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config/config.json');

module.exports = (bot) => {
  bot.command('listAdmins', async (ctx) => {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de configuração.');
    }

    if (!config.admins || config.admins.length === 0) {
      return ctx.reply('Nenhum administrador registrado.');
    }

    const buttons = config.admins.map(admin => [
      {
        text: admin.name,
        callback_data: `noop`
      },
      {
        text: '🗑',
        callback_data: `deladm_${admin.id}`
      }
    ]);

    ctx.reply('Lista de Administradores:', {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  });

  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (data.startsWith('deladm_')) {
      const adminId = data.split('_')[1];

      let config;
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        console.error('Erro ao ler o arquivo de configuração:', error.message);
        return ctx.reply('Erro ao acessar o arquivo de configuração.');
      }

      const adminIndex = config.admins.findIndex(admin => admin.id.toString() === adminId);
      if (adminIndex === -1) {
        return ctx.answerCbQuery('Administrador não encontrado.', { show_alert: true });
      }

      const removedAdmin = config.admins.splice(adminIndex, 1)[0];

      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

        // Refresh the list of buttons
        const buttons = config.admins.map(admin => [
          {
            text: admin.name,
            callback_data: `noop`
          },
          {
            text: '🗑',
            callback_data: `deladm_${admin.id}`
          }
        ]);

        await ctx.editMessageReplyMarkup({
          inline_keyboard: buttons
        });

        // Log the action in the log group
        if (config.logGroup?.id && config.logGroup?.topic) {
          const logMessage = `🗑 *Administrador:*\n` +
            `👤 *Admin:* ${ctx.from.username || ctx.from.first_name} (ID: ${ctx.from.id})\n` +
            `🕒 *Horário:* ${new Date().toLocaleString('pt-BR')}\n` +
            `📋 *Ação:* Remoção de Administrador\n` +
            `👤 *Administrador Removido:* ${removedAdmin.name}\n` +
            `🆔 *ID do Administrador:* ${removedAdmin.id}`;
          await bot.telegram.sendMessage(config.logGroup.id, logMessage, {
            parse_mode: 'Markdown',
            message_thread_id: config.logGroup.topic
          });
        }

        ctx.answerCbQuery('Administrador removido com sucesso.');
      } catch (error) {
        console.error('Erro ao salvar o arquivo de configuração:', error.message);
        ctx.answerCbQuery('Erro ao salvar a configuração atualizada.', { show_alert: true });
      }
    }
  });
};
