const path = require('path');
const {
  readDatabase,
  writeDatabase,
  initializeGroupData,
  isGroupCommand,
  getGroupInfo
} = require('../../utils/databaseUtils');

const filePath = path.join(__dirname, '../../database/dalytryhard.json');

module.exports = (bot) => {
  bot.command('tryhardme', async (ctx) => {
    const now = new Date();
    const brasiliaDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000 - 3 * 3600000).toISOString().split('T')[0];
    const userId = ctx.from.id.toString();
    const username = ctx.from.username || ctx.from.first_name;
    const mention = `[${username}](tg://user?id=${userId})`;

    if (!isGroupCommand(ctx)) {
      // Executado no privado, sem salvar no banco de dados
      const tryhard = Math.floor(Math.random() * 101);
      const banana = 100 - tryhard;

      return ctx.reply(`⛏️ Hoje o ${mention} está ${tryhard}% Try Hard 🌟 e ${banana}% Embananado 🍌`, {
        parse_mode: 'Markdown'
      });
    }

    // Executado em grupo, salvar no banco de dados
    const groupInfo = getGroupInfo(ctx);
    const jsonData = readDatabase(filePath);

    // Inicializar a estrutura de dados com o nome do grupo
    initializeGroupData(jsonData, groupInfo.id, brasiliaDate, groupInfo.name);

    if (jsonData[groupInfo.id][brasiliaDate][userId]) {
      return ctx.reply(`⛏️ ${mention}, você já usou o comando hoje! Amanhã tem mais!`, {
        reply_to_message_id: jsonData[groupInfo.id][brasiliaDate][userId].message_id,
        parse_mode: 'Markdown'
      });
    }

    let tryhard;
    do {
      tryhard = Math.floor(Math.random() * 101);
    } while (Object.values(jsonData[groupInfo.id][brasiliaDate]).some(entry => entry.tryhard === tryhard));

    const banana = 100 - tryhard;

    const sentMessage = await ctx.reply(`⛏️ Hoje o ${mention} está ${tryhard}% Try Hard 🌟 e ${banana}% Embananado 🍌`, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    });

    jsonData[groupInfo.id][brasiliaDate][userId] = {
      nome: username,
      tryhard: tryhard,
      banana: banana,
      message_id: sentMessage.message_id
    };

    writeDatabase(filePath, jsonData);
  });
};
