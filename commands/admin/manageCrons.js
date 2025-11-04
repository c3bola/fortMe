const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config/config.json');

module.exports = (bot) => {
  bot.command('manageCrons', async (ctx) => {
    // Ler o arquivo de configuração existente
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('[ERROR] Falha ao carregar o arquivo config.json:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de configuração.');
    }

    // Verificar se há crons configurados
    if (!config.cronJobs || Object.keys(config.cronJobs).length === 0) {
      return ctx.reply('Nenhum cron configurado no momento.');
    }

    // Construir os botões
    const buttons = [
      [{ text: 'Nome', callback_data: 'header' }, { text: 'Status', callback_data: 'header' }]
    ];

    Object.entries(config.cronJobs).forEach(([cronName, cronConfig]) => {
      buttons.push([
        { text: cronName, callback_data: `noop` },
        { text: cronConfig.status ? '✅' : '☑️', callback_data: `mnc_${cronName}` }
      ]);
    });

    // Enviar a mensagem com os botões
    await ctx.reply('Gerenciamento de Crons:', {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  });

  // Callback para alternar o status do cron
  bot.action(/mnc_(.+)/, async (ctx) => {
    const cronName = ctx.match[1];

    // Ler o arquivo de configuração existente
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('[ERROR] Falha ao carregar o arquivo config.json:', error.message);
      return ctx.answerCbQuery('Erro ao acessar o arquivo de configuração.');
    }

    // Alternar o status do cron
    const cron = config.cronJobs[cronName];
    if (cron) {
      cron.status = !cron.status;

      // Salvar a configuração atualizada
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(`[INFO] Estado do cron "${cronName}" alterado para ${cron.status ? 'Ativo' : 'Inativo'}.`);

        // Atualizar os botões
        const buttons = [
          [{ text: 'Nome', callback_data: 'header' }, { text: 'Status', callback_data: 'header' }]
        ];

        Object.entries(config.cronJobs).forEach(([name, cronConfig]) => {
          buttons.push([
            { text: name, callback_data: `noop` },
            { text: cronConfig.status ? '✅' : '☑️', callback_data: `mnc_${name}` }
          ]);
        });

        await ctx.editMessageReplyMarkup({
          inline_keyboard: buttons
        });

        return ctx.answerCbQuery(`Status do cron "${cronName}" atualizado para ${cron.status ? 'Ativo' : 'Inativo'}.`);
      } catch (error) {
        console.error('[ERROR] Falha ao salvar o arquivo config.json:', error.message);
        return ctx.answerCbQuery('Erro ao salvar a configuração atualizada.');
      }
    } else {
      return ctx.answerCbQuery('Cron não encontrado.');
    }
  });
};
