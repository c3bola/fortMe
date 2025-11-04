const fs = require('fs');
const path = require('path');

const databaseFiles = {
  dalygirl: path.join(__dirname, '../../database/dalygirl.json'),
  dalytryhard: path.join(__dirname, '../../database/dalytryhard.json'),
  dalyjonesy: path.join(__dirname, '../../database/dalyjonesy.json'),
  dalyme: path.join(__dirname, '../../database/dalyme.json')
};

module.exports = (bot) => {
  bot.command('clearDatabase', async (ctx) => {
    // Criar botões para cada arquivo do banco de dados
    const buttons = Object.keys(databaseFiles).map((key) => [
      { text: `Limpar ${key}`, callback_data: `clear_${key}` }
    ]);

    await ctx.reply('Escolha o arquivo que deseja limpar:', {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  });

  bot.action(/clear_(.+)/, async (ctx) => {
    const [, fileKey] = ctx.match; // Extrair o arquivo
    const filePath = databaseFiles[fileKey];

    if (!filePath || !fs.existsSync(filePath)) {
      return ctx.answerCbQuery('Arquivo não encontrado ou inválido.', { show_alert: true });
    }

    try {
      // Limpar completamente o arquivo
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2), 'utf8');
      console.log(`[INFO] O arquivo ${fileKey} foi limpo com sucesso.`);
      await ctx.answerCbQuery(`O arquivo ${fileKey} foi limpo completamente! ✅`, { show_alert: true });
    } catch (error) {
      console.error(`[ERROR] Falha ao limpar o arquivo ${fileKey}:`, error.message);
      await ctx.answerCbQuery('Erro ao limpar o arquivo. Verifique os logs para mais detalhes.', { show_alert: true });
    }
  });
};
