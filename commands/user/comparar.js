'use strict';

const {
  ensureUser,
  getUserCollectionIds,
  getUserCollectionProgress,
  getUserByUsername
} = require('../../utils/databaseUtilsMySQL');

module.exports = (bot) => {
  // ─── Comando: /comparar ───────────────────────────────────────────────────────

  bot.command('comparar', async (ctx) => {
    console.log('[DEBUG] /comparar', { chatId: ctx.chat?.id });
    try {
      await ensureUser(ctx.from.id.toString(), 1, { first_name: ctx.from.first_name, username: ctx.from.username });

      let targetId = null;
      let targetName = '';

      // Verifica se respondeu a uma mensagem
      if (ctx.message.reply_to_message) {
        const replied = ctx.message.reply_to_message.from;
        
        if (replied.is_bot) return ctx.reply('⚠️ Bots não colecionam sprites! Tente comparar com um humano. 🤖', { reply_to_message_id: ctx.message.message_id });
        if (replied.id === ctx.from.id) return ctx.reply('⚠️ Você não pode comparar a coleção com você mesmo!', { reply_to_message_id: ctx.message.message_id });
        
        targetId = replied.id.toString();
        targetName = replied.first_name;
        await ensureUser(targetId, 1, { first_name: replied.first_name, username: replied.username });
        
      } else {
        // Se não respondeu, verifica se passou um @username por argumento
        const args = ctx.message.text.split(/\s+/).slice(1).join(' ').trim();
        
        if (!args) {
          return ctx.reply('⚖️ <b>Comparar Coleções</b>\n\nPara comparar sua coleção com a de um amigo, você pode:\n1. Responder a uma mensagem dele com <code>/comparar</code>\n2. Digitar <code>/comparar @username_dele</code>', { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message.message_id
          });
        }

        const cleanUsername = args.replace(/^@/, '');
        
        if (cleanUsername.toLowerCase() === ctx.from.username?.toLowerCase()) {
          return ctx.reply('⚠️ Você não pode comparar a coleção com você mesmo!', { reply_to_message_id: ctx.message.message_id });
        }

        const targetUser = await getUserByUsername(cleanUsername);
        if (!targetUser) {
          return ctx.reply(`⚠️ O usuário <b>@${cleanUsername}</b> não foi encontrado no banco de dados. Ele precisa já ter interagido com o bot antes.`, { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message.message_id
          });
        }

        targetId = targetUser.id_user.toString();
        targetName = targetUser.first_name || cleanUsername;
      }

      // Se chegou aqui, temos o alvo. Vamos buscar as coleções!
      const myId = ctx.from.id.toString();
      const myName = ctx.from.first_name;

      const [myCol, targetCol, myProg, targetProg] = await Promise.all([
        getUserCollectionIds(myId),
        getUserCollectionIds(targetId),
        getUserCollectionProgress(myId),
        getUserCollectionProgress(targetId)
      ]);

      // Matemática de conjuntos (Sets)
      let inCommon = 0;
      let onlyMe = 0;
      let onlyTarget = 0;

      myCol.forEach(id => {
        if (targetCol.has(id)) inCommon++;
        else onlyMe++;
      });
      targetCol.forEach(id => {
        if (!myCol.has(id)) onlyTarget++;
      });

      // Montar resposta
      const text = `⚖️ <b>Comparação de Coleções</b>\n\n` +
        `👤 <b>${myName}</b>: ${myProg.total_owned}/${myProg.total_available} (${myProg.percentage}%)\n` +
        `👤 <b>${targetName}</b>: ${targetProg.total_owned}/${targetProg.total_available} (${targetProg.percentage}%)\n\n` +
        `🤝 <b>Em comum:</b> ${inCommon} sprite(s)\n` +
        `📈 <b>Só você tem:</b> ${onlyMe} sprite(s)\n` +
        `📉 <b>Só ${targetName} tem:</b> ${onlyTarget} sprite(s)\n\n` +
        `<i>Dica: Use /ajuda caso o ${targetName} tenha sprites que você precisa!</i>`;

      // Responde à mensagem do usuário que enviou o comando
      return ctx.reply(text, { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message.message_id
      });

    } catch (error) {
      console.error('[ERROR] /comparar:', error.message);
      await ctx.reply('❌ Erro ao comparar as coleções.', { reply_to_message_id: ctx.message.message_id });
    }
  });
};