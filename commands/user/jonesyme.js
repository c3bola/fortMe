const { query } = require('../../database/dbConnection');
const {
  ensureUser,
  ensureCommunity,
  ensureBotGroup,
  getRandomContent,
  getDailyUsage,
  recordDailyUsage,
  recordVote,
  getVotes
} = require('../../utils/databaseUtilsMySQL');

const FEATURE_ID = 3; // ID da feature jonesyme

module.exports = (bot) => {
  bot.command('jonesyme', async (ctx) => {
    try {
      console.log('[DEBUG] Comando /jonesyme iniciado', { userId: ctx.from?.id, chatId: ctx.chat?.id });

      const userId = ctx.from.id.toString();
      const username = ctx.from.username || ctx.from.first_name;
      const mention = `[${username}](tg://user?id=${userId})`;
      
      // Data de Brasília (UTC-3)
      const now = new Date();
      const brasiliaDate = new Date(now.getTime() - 3 * 3600000).toISOString().split('T')[0];
      const date = brasiliaDate;

      // COMANDO NO PRIVADO
      if (ctx.chat.type === 'private') {
        console.log('[DEBUG] /jonesyme executado no privado');

        // Garantir que o usuário existe com metadados
        await ensureUser(userId, 1, {
          first_name: ctx.from.first_name,
          last_name: ctx.from.last_name,
          username: ctx.from.username
        });

        // Buscar conteúdo aleatório
        const content = await getRandomContent(FEATURE_ID);
        
        if (!content) {
          return ctx.reply('❌ Nenhuma imagem disponível no momento. Contate um administrador.');
        }

        try {
          // Enviar imagem sem salvar uso (privado)
          await ctx.replyWithPhoto(content.image_id, {
            caption: content.text.replace('{user}', mention),
            parse_mode: 'Markdown'
          });

          console.log('[SUCCESS] /jonesyme executado no privado', { userId, contentId: content.id_fortme_contents });

        } catch (photoError) {
          console.error('[ERROR] Falha ao enviar foto no privado:', photoError.message);
          return ctx.reply('❌ Erro ao enviar a imagem. Tente novamente mais tarde.');
        }

        return;
      }

      // COMANDO EM GRUPO
      const groupId = ctx.chat.id.toString();
      const groupName = ctx.chat.title || 'Grupo';

      console.log('[DEBUG] /jonesyme executado no grupo', { groupId, groupName });

      // Garantir que o usuário existe no banco com metadados
      await ensureUser(userId, 1, {
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username
      });

      // Garantir que o grupo existe no banco
      await ensureCommunity(groupId, groupName, 'group');
      
      // Registrar grupo para broadcast
      await ensureBotGroup(groupId, groupName);

      // Verificar se já usou hoje
      const existingUsage = await getDailyUsage(FEATURE_ID, groupId, userId, date);
      
      if (existingUsage) {
        console.log('[DEBUG] Usuário já usou /jonesyme hoje');
        
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
                { text: '❤️', callback_data: `jonesyme_heart_${userId}` },
                { text: '😡', callback_data: `jonesyme_hat_${userId}` }
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

        console.log('[SUCCESS] /jonesyme executado com sucesso', {
          userId,
          groupId,
          contentId: content.id_fortme_contents
        });

      } catch (photoError) {
        console.error('[ERROR] Falha ao enviar foto no grupo:', photoError.message);
        return ctx.reply('❌ Erro ao enviar a imagem. Tente novamente mais tarde.');
      }

    } catch (error) {
      console.error('[ERROR] Erro no comando /jonesyme:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      ctx.reply('❌ Ocorreu um erro ao processar seu comando. Tente novamente.');
    }
  });

  // Handler para votação jonesyme
  bot.action(/^jonesyme_(heart|hat)_(.+)$/, async (ctx) => {
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
            { text: `❤️ ${votes.hearts}`, callback_data: `jonesyme_heart_${targetUserId}` },
            { text: `😡 ${votes.hats}`, callback_data: `jonesyme_hat_${targetUserId}` }
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
