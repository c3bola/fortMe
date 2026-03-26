
const {
  ensureUser,
  ensureCommunity,
  ensureBotGroup,
  getRandomContent,
  getDailyUsage,
  recordDailyUsage,
  getCurrentDate,
  isGroupCommand,
  getGroupInfo,
  getUserInfo,
  recordVote,
  getVotes
} = require('../../utils/databaseUtilsMySQL');
const { removeContent } = require('../../utils/databaseUtilsMySQL');
const { query } = require('../../database/dbConnection');
const config = require('../../config/config');

const FEATURE_ID = 2; // fortgirl

// Função para remover imagem inválida e registrar no log
async function removeInvalidImage(bot, contentId, imageId) {
  try {
    console.log('[WARNING] Removendo conteúdo com file_id inválido:', imageId);
    
    // Desativar conteúdo no banco
    await removeContent(contentId);
    
    console.log('[SUCCESS] Conteúdo ID', contentId, 'desativado no banco de dados.');
    
    // Enviar notificação para o grupo de logs
    if (config.logGroup && config.logGroup.status) {
      const message = `⚠️ *IMAGEM INVÁLIDA REMOVIDA (FORTGIRL)*\n\n` +
        `🆔 *Content ID*: ${contentId}\n` +
        `📷 *File ID*: \`${imageId}\`\n\n` +
        `❌ O file_id desta imagem não é mais válido no Telegram e foi desativado no banco de dados.`;
      
      await bot.telegram.sendMessage(config.logGroup.id, message, {
        parse_mode: 'Markdown',
        message_thread_id: config.logGroup.topic || undefined
      }).catch(err => console.error('[ERROR] Falha ao enviar log de remoção:', err.message));
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] Falha ao remover conteúdo inválido:', error.message);
    return false;
  }
}

module.exports = (bot) => {
  bot.command('fortgirl', async (ctx) => {
    try {
      console.log('[DEBUG] Comando /fortgirl iniciado', { 
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
        console.log('[DEBUG] /fortgirl executado no privado');
        
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
            await removeInvalidImage(bot, content.id_fortme_contents, content.image_id);
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
      
      // Registrar grupo para broadcast
      await ensureBotGroup(groupId, groupName);

      // Verificar se já usou hoje
      const existingUsage = await getDailyUsage(FEATURE_ID, groupId, userId, date);
      
      if (existingUsage) {
        console.log('[DEBUG] Usuário já usou /fortgirl hoje');
        
        // Buscar votos atuais
        const votes = await getVotes(existingUsage.id_fortme_daily_usage);
        
        return ctx.reply(
          `🎯 Ei ${mention}, sua skin tá aqui! Dá uma olhada e arrasa no lobby! 🕹️\n\n` +
          `Votos: ❤️ ${votes.hearts} | 😡 ${votes.hats}`,
          {
            reply_to_message_id: existingUsage.message_id,
            parse_mode: 'Markdown'
          }
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
          reply_to_message_id: ctx.message.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❤️', callback_data: `fortgirl_heart_${userId}` },
                { text: '😡', callback_data: `fortgirl_hat_${userId}` }
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

        console.log('[SUCCESS] /fortgirl executado com sucesso', {
          userId,
          groupId,
          contentId: content.id_fortme_contents
        });

      } catch (photoError) {
        console.error('[ERROR] Falha ao enviar foto no grupo:', photoError.message);
        
        if (photoError.message.includes('wrong file identifier') || 
            photoError.message.includes('file_id')) {
          // Remover conteúdo inválido
          await removeInvalidImage(bot, content.id_fortme_contents, content.image_id);
          return ctx.reply('❌ Erro ao enviar imagem. O conteúdo foi removido. Tente novamente.');
        }
        
        return ctx.reply('❌ Erro ao enviar a imagem. Tente novamente mais tarde.');
      }

    } catch (error) {
      console.error('[ERROR] Erro no comando /fortgirl:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      ctx.reply('❌ Ocorreu um erro ao processar seu comando. Tente novamente.');
    }
  });

  // Handler para votação fortgirl
  bot.action(/^fortgirl_(heart|hat)_(.+)$/, async (ctx) => {
    try {
      const voteType = ctx.match[1]; // 'heart' ou 'hat'
      const targetUserId = ctx.match[2];
      const voterId = ctx.from.id.toString();

      console.log('[DEBUG] Voto recebido:', { voteType, targetUserId, voterId });

      // Garantir que o votante existe no banco com metadados
      await ensureUser(voterId, 1, {
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username
      });

      // Buscar o daily usage pelo message_id
      const usage = await query(
        'SELECT * FROM tb_fortme_daily_usage WHERE message_id = ? AND fk_group_id = ? AND fk_id_features = ?',
        [ctx.callbackQuery.message.message_id, ctx.chat.id.toString(), FEATURE_ID]
      );

      if (usage.length === 0) {
        console.log('[ERROR] Registro não encontrado para message_id:', ctx.callbackQuery.message.message_id);
        return ctx.answerCbQuery('❌ Registro não encontrado.', { show_alert: true });
      }

      console.log('[DEBUG] Daily usage encontrado:', usage[0].id_fortme_daily_usage);

      // Verificar se já votou nesta opção
      const existingVote = await query(
        'SELECT vote FROM tb_fortme_votes WHERE fk_daily_usage_id = ? AND voter_id = ?',
        [usage[0].id_fortme_daily_usage, voterId]
      );

      if (existingVote.length > 0 && existingVote[0].vote === voteType) {
        // Já votou na mesma opção - não faz nada, só confirma
        const voteEmoji = voteType === 'heart' ? '❤️ Você já curtiu esta skin!' : '😡 Você já votou nesta opção!';
        return ctx.answerCbQuery(voteEmoji, { show_alert: true });
      }

      // Registrar ou atualizar voto
      await recordVote(usage[0].id_fortme_daily_usage, voterId, voteType);
      console.log('[DEBUG] Voto registrado com sucesso');

      // Buscar votos atualizados
      const votes = await getVotes(usage[0].id_fortme_daily_usage);
      console.log('[DEBUG] Votos atualizados:', votes);

      // Atualizar botões com contador
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [
          [
            { text: `❤️ ${votes.hearts}`, callback_data: `fortgirl_heart_${targetUserId}` },
            { text: `😡 ${votes.hats}`, callback_data: `fortgirl_hat_${targetUserId}` }
          ]
        ]
      });

      const voteEmoji = voteType === 'heart' ? '❤️ Você curtiu esta skin!' : '😡 Você não gostou desta skin!';
      ctx.answerCbQuery(voteEmoji, { show_alert: true });

    } catch (error) {
      console.error('[ERROR] Erro ao processar voto:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      ctx.answerCbQuery('❌ Erro ao registrar voto.', { show_alert: true });
    }
  });
};
