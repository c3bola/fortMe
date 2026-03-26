const {
  ensureUser,
  ensureCommunity,
  getRandomContent,
  getDailyUsage,
  recordDailyUsage,
  getCurrentDate,
  isGroupCommand,
  getGroupInfo,
  getUserInfo
} = require('../../utils/databaseUtilsMySQL');

const FEATURE_ID = 1; // fortme

module.exports = (bot) => {
  bot.command('fortme', async (ctx) => {
    try {
      console.log('[DEBUG] Comando /fortme iniciado', { 
        userId: ctx.from?.id, 
        chatId: ctx.chat?.id 
      });

      const date = getCurrentDate();
      const userInfo = getUserInfo(ctx);
      const userId = userInfo.id;
      const username = userInfo.username;
      const mention = `[${username}](tg://user?id=${userId})`;

      // Garantir que o usuário existe no banco
      await ensureUser(userId, 1); // Perfil 1 = usuário comum

      if (!isGroupCommand(ctx)) {
        console.log('[DEBUG] /fortme executado no privado');
        
        // No privado, não salva uso, apenas envia imagem aleatória
        const content = await getRandomContent(FEATURE_ID);
        
        if (!content) {
          return ctx.reply('❌ Nenhuma imagem disponível no momento. Tente novamente mais tarde.');
        }

        try {
          return await ctx.replyWithPhoto(content.image_id, {
            caption: content.text.replace('{user}', mention),
            parse_mode: 'Markdown'
          });
        } catch (photoError) {
          console.error('[ERROR] Falha ao enviar foto:', photoError.message);
          
          if (photoError.message.includes('wrong file identifier') || 
              photoError.message.includes('file_id')) {
            // Remover conteúdo inválido
            const { removeContent } = require('../../utils/databaseUtilsMySQL');
            await removeContent(content.id_fortme_contents);
            return ctx.reply('❌ Erro ao enviar imagem. O conteúdo foi removido. Tente novamente.');
          }
          
          return ctx.reply('❌ Erro ao enviar a imagem. Tente novamente mais tarde.');
        }
      }

      // Comando executado em grupo
      const groupInfo = getGroupInfo(ctx);
      const groupId = groupInfo.id;
      const groupName = groupInfo.name;

      // Garantir que o grupo existe no banco
      await ensureCommunity(groupId, groupName, 'group');

      // Verificar se já usou hoje
      const existingUsage = await getDailyUsage(FEATURE_ID, groupId, userId, date);
      
      if (existingUsage) {
        console.log('[DEBUG] Usuário já usou /fortme hoje');
        return ctx.reply(
          `⏰ ${username}, você já usou o /fortme hoje! Volte amanhã para sua nova skin! 🎮`,
          { reply_to_message_id: ctx.message.message_id }
        );
      }

      // Buscar conteúdo aleatório
      const content = await getRandomContent(FEATURE_ID);
      
      if (!content) {
        return ctx.reply('❌ Nenhuma imagem disponível no momento. Contate um administrador.');
      }

      try {
        // Enviar imagem
        const sentMessage = await ctx.replyWithPhoto(content.image_id, {
          caption: content.text.replace('{user}', mention),
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❤️', callback_data: `vote_heart_${userId}` },
                { text: '🎩', callback_data: `vote_hat_${userId}` }
              ]
            ]
          }
        });

        // Registrar uso no banco
        await recordDailyUsage({
          featureId: FEATURE_ID,
          contentId: content.id_fortme_contents,
          groupId: groupId,
          userId: userId,
          messageId: sentMessage.message_id,
          date: date
        });

        console.log('[SUCCESS] /fortme executado com sucesso', {
          userId,
          groupId,
          contentId: content.id_fortme_contents
        });

      } catch (photoError) {
        console.error('[ERROR] Falha ao enviar foto no grupo:', photoError.message);
        
        if (photoError.message.includes('wrong file identifier') || 
            photoError.message.includes('file_id')) {
          // Remover conteúdo inválido
          const { removeContent } = require('../../utils/databaseUtilsMySQL');
          await removeContent(content.id_fortme_contents);
          return ctx.reply('❌ Erro ao enviar imagem. O conteúdo foi removido. Tente novamente.');
        }
        
        return ctx.reply('❌ Erro ao enviar a imagem. Tente novamente mais tarde.');
      }

    } catch (error) {
      console.error('[ERROR] Erro no comando /fortme:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      ctx.reply('❌ Ocorreu um erro ao processar seu comando. Tente novamente.');
    }
  });

  // Handler para votação
  bot.action(/^vote_(heart|hat)_(.+)$/, async (ctx) => {
    try {
      const voteType = ctx.match[1]; // 'heart' ou 'hat'
      const targetUserId = ctx.match[2];
      const voterId = ctx.from.id.toString();

      // Não pode votar em si mesmo
      if (voterId === targetUserId) {
        return ctx.answerCbQuery('❌ Você não pode votar em si mesmo!', { show_alert: true });
      }

      // Buscar o daily usage pelo message_id
      const { query } = require('../../database/dbConnection');
      const usage = await query(
        'SELECT * FROM tb_fortme_daily_usage WHERE message_id = ? AND fk_id_community = ?',
        [ctx.callbackQuery.message.message_id, ctx.chat.id.toString()]
      );

      if (usage.length === 0) {
        return ctx.answerCbQuery('❌ Registro não encontrado.', { show_alert: true });
      }

      // Registrar voto
      const { recordVote, getVotes } = require('../../utils/databaseUtilsMySQL');
      await recordVote(usage[0].id_fortme_daily_usage, voterId, voteType);

      // Buscar votos atualizados
      const votes = await getVotes(usage[0].id_fortme_daily_usage);

      // Atualizar botões com contador
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [
          [
            { text: `❤️ ${votes.hearts}`, callback_data: `vote_heart_${targetUserId}` },
            { text: `🎩 ${votes.hats}`, callback_data: `vote_hat_${targetUserId}` }
          ]
        ]
      });

      const voteEmoji = voteType === 'heart' ? '❤️' : '🎩';
      ctx.answerCbQuery(`${voteEmoji} Voto registrado!`);

    } catch (error) {
      console.error('[ERROR] Erro ao processar voto:', error.message);
      ctx.answerCbQuery('❌ Erro ao registrar voto.');
    }
  });
};
