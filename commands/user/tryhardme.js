const {
  ensureUser,
  ensureCommunity,
  ensureBotGroup,
  checkDailyUsage,
  saveDailyUsage
} = require('../../utils/databaseUtilsMySQL');

const FEATURE_ID = 4; // tryhardme

module.exports = (bot) => {
  bot.command('tryhardme', async (ctx) => {
    try {
      const userId = ctx.from.id;
      const username = ctx.from.username || ctx.from.first_name;
      const firstName = ctx.from.first_name || '';
      const lastName = ctx.from.last_name || '';
      const mention = `[${username}](tg://user?id=${userId})`;

      // Comando no privado - não salva no banco
      if (ctx.chat.type === 'private') {
        const tryhard = Math.floor(Math.random() * 101);
        const banana = 100 - tryhard;

        return ctx.reply(
          `⛏️ Hoje o ${mention} está ${tryhard}% Try Hard 🌟 e ${banana}% Embananado 🍌`,
          { parse_mode: 'Markdown' }
        );
      }

      // Comando em grupo - salva no banco
      const groupId = ctx.chat.id;
      const groupName = ctx.chat.title || 'Grupo Desconhecido';

      // Garantir que usuário, comunidade e bot_group existem
      await ensureUser(userId, 1, { first_name: firstName, last_name: lastName, username });
      await ensureCommunity(groupId, groupName);
      await ensureBotGroup(groupId, groupName);

      // Verificar se já usou hoje
      const existingUsage = await checkDailyUsage(userId, groupId, FEATURE_ID);
      
      if (existingUsage) {
        return ctx.reply(
          `⛏️ ${mention}, você já usou o comando hoje! Você está ${existingUsage.percentage_value}% Try Hard 🌟\nAmanhã tem mais!`,
          {
            reply_to_message_id: existingUsage.message_id,
            parse_mode: 'Markdown'
          }
        );
      }

      // Gerar percentual tryhard único (0-100)
      const tryhard = Math.floor(Math.random() * 101);
      const banana = 100 - tryhard;

      // Enviar mensagem
      const sentMessage = await ctx.reply(
        `⛏️ Hoje o ${mention} está ${tryhard}% Try Hard 🌟 e ${banana}% Embananado 🍌`,
        {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        }
      );

      // Salvar uso diário com percentage_value
      await saveDailyUsage(
        userId,
        groupId,
        FEATURE_ID,
        null, // não tem content_id para tryhardme
        sentMessage.message_id,
        tryhard // percentage_value
      );

      // NÃO incrementar tryhard/banana aqui!
      // Esses contadores são incrementados apenas quando o usuário vence um X1 com LOBBY ESPECIAL

    } catch (error) {
      console.error('[TRYHARDME ERROR]', error);
      ctx.reply('❌ Ocorreu um erro ao processar o comando. Tente novamente mais tarde.');
    }
  });
};
