const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config/config.json');

module.exports = (bot) => {
  bot.command('config', async (ctx) => {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Criar botões para os comandos
    const buttons = Object.keys(config.commands).map((command) => [
      { text: command, callback_data: `cmd_info_${command}` },
      { text: config.commands[command] ? '✅' : '☑️', callback_data: `cmdt_${command}` }
    ]);
    console.log(buttons)
    // Enviar mensagem com os botões
    await ctx.reply('Configurações do Bot:', {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  });

  // Callback para alternar o status dos comandos
  
  bot.action(/cmdt_(.+)/, async (ctx) => {
    console.log(25)
    const command = ctx.match[1];

    // Ler o arquivo de configuração existente
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      return ctx.answerCbQuery('Erro ao acessar o arquivo de configuração.');
    }

    if (config.commands[command] !== undefined) {
      // Alternar o status do comando
      config.commands[command] = !config.commands[command];

      // Salvar a configuração atualizada
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

        // Atualizar os botões
        const buttons = Object.keys(config.commands).map((cmd) => [
          { text: cmd, callback_data: `cmd_info_${cmd}` },
          { text: config.commands[cmd] ? '✅' : '☑️', callback_data: `cmdt_${cmd}` }
        ]);

        await ctx.editMessageReplyMarkup({
          inline_keyboard: buttons
        });

        return ctx.answerCbQuery(`O comando "${command}" foi ${config.commands[command] ? 'ativado' : 'desativado'}.`);
      } catch (error) {
        console.error('Erro ao salvar o arquivo de configuração:', error.message);
        return ctx.answerCbQuery('Erro ao salvar a configuração atualizada.');
      }
    } else {
      return ctx.answerCbQuery('Comando não encontrado.');
    }
  });

  // Callback para exibir informações sobre o comando
  bot.action(/cmd_info_(.+)/, async (ctx) => {
    const command = ctx.match[1];
    return ctx.answerCbQuery(`Informações sobre o comando "${command}".`);
  });
};
