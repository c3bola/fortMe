'use strict';

const fs = require('fs');

const {
  ensureUser,
  ensureBotGroup,
  getElementalCategories,
  getVariantsByCategory,
  getUserCollectionIds,
  getUserElementalConfig,
  updateUserElementalConfig
} = require('../../utils/databaseUtilsMySQL');

const {
  catEmoji,
  buildProgressBar,
  generateCollectionMosaic
} = require('./elementalCommon');

module.exports = (bot) => {
  // ─── Comando: /colecao ────────────────────────────────────────────────────────

  bot.command('colecao', async (ctx) => {
    const userId = ctx.from?.id?.toString();
    console.log(`[LOG] /colecao acionado pelo usuário ${userId}`);
    
    let tempMsg; // Variável para armazenar a mensagem temporária

    try {
      // 1. Envia a mensagem de aviso IMEDIATAMENTE respondendo o comando do usuário
      tempMsg = await ctx.reply(
        '⏳ <b>Processando sua coleção...</b>\n\nA geração da imagem pode levar alguns minutos. Basta aguardar!', 
        { 
          parse_mode: 'HTML',
          reply_to_message_id: ctx.message?.message_id 
        }
      );

      await ensureUser(ctx.from.id.toString(), 1, { first_name: ctx.from.first_name, username: ctx.from.username });
      if (ctx.chat.type !== 'private') await ensureBotGroup(ctx.chat.id.toString(), ctx.chat.title || 'Grupo');

      const [categories, ownedIds, config] = await Promise.all([
        getElementalCategories(),
        getUserCollectionIds(userId),
        getUserElementalConfig(userId)
      ]);

      const replyOptions = {
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id // <-- GARANTE QUE A IMAGEM FINAL RESPONDA O COMANDO ORIGINAL
      };

      if (ownedIds.size === 0) {
        await ctx.reply('📦 <b>Sua Coleção</b>\n\nVocê ainda não marcou nenhum sprite. Use /elementais para explorar!', replyOptions);
        if (tempMsg) await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
        return;
      }

      const categoryLines = [];
      for (const cat of categories) {
        const variants = await getVariantsByCategory(cat.id_elemental_category);
        const owned = variants.filter(v => ownedIds.has(v.id_elemental_variant)).length;
        const total = variants.length;
        const bar = buildProgressBar(owned, total);
        categoryLines.push(`${catEmoji(cat.code)} <b>${cat.name}</b>  ${bar}  <i>${owned}/${total}</i>`);
      }

      const textLegenda = `📦 <b>Sua Coleção</b>\n\n${categoryLines.join('\n')}\n\n<i>Total: ${ownedIds.size} sprite(s) coletado(s).</i>`;
      replyOptions.caption = textLegenda;

      // Se já tem imagem em cache, envia direto
      if (config.collection_image_id) {
        await ctx.replyWithPhoto(config.collection_image_id, replyOptions);
      } else {
        // Se não, gera pelo Jimp
        const mosaicPath = await generateCollectionMosaic(userId);
        if (fs.existsSync(mosaicPath)) {
          const stats = fs.statSync(mosaicPath);
          const fileSizeInBytes = stats.size;
          const tenMegabytesInBytes = 10 * 1024 * 1024; // 10.485.760 bytes

          let sentMsg;

          if (fileSizeInBytes > tenMegabytesInBytes) {
            // Se for maior que 10MB, envia como documento (arquivo) respondendo quem solicitou
            sentMsg = await ctx.replyWithDocument(
              { source: fs.createReadStream(mosaicPath), filename: `colecao_${userId}.png` },
              replyOptions
            );
          } else {
            // Se for menor ou igual a 10MB, envia como foto normal respondendo quem solicitou
            sentMsg = await ctx.replyWithPhoto(
              { source: fs.createReadStream(mosaicPath) },
              replyOptions
            );
          }

          // Salva o file_id retornado para uso futuro (apenas se foi enviado como Photo)
          if (sentMsg?.photo) {
            const uploadedFileId = sentMsg.photo[sentMsg.photo.length - 1].file_id;
            await updateUserElementalConfig(userId, { collection_image_id: uploadedFileId });
          }
          
          fs.unlinkSync(mosaicPath); // Limpa o arquivo temporário
        } else {
          await ctx.reply(textLegenda, replyOptions);
        }
      }

      // 2. Apaga a mensagem temporária após a imagem ou o texto ser enviado com sucesso
      if (tempMsg) {
        await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
      }

    } catch (error) {
      console.error('[ERROR] /colecao:', error.message);
      await ctx.reply('❌ Erro ao carregar sua coleção.', { reply_to_message_id: ctx.message?.message_id });
      // Garante que a mensagem temporária será apagada mesmo se der erro
      if (tempMsg) {
        await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
      }
    }
  });

  bot.action(/^el_colecao$/, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    try {
      await ctx.answerCbQuery();
      const [categories, ownedIds] = await Promise.all([
        getElementalCategories(),
        getUserCollectionIds(userId),
      ]);

      if (ownedIds.size === 0) {
        return ctx.editMessageText(
          '📦 <b>Sua Coleção</b>\n\nVocê ainda não marcou nenhum sprite como obtido.\n\nUse /elementais para explorar o catálogo!',
          {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: '⬅️ Voltar ao Perfil', callback_data: 'el_perfil' }]] },
          }
        );
      }

      const categoryLines = [];
      for (const cat of categories) {
        const variants = await getVariantsByCategory(cat.id_elemental_category);
        const owned = variants.filter(v => ownedIds.has(v.id_elemental_variant)).length;
        const total = variants.length;
        const bar = buildProgressBar(owned, total);
        categoryLines.push(`${catEmoji(cat.code)} <b>${cat.name}</b>  ${bar}  <i>${owned}/${total}</i>`);
      }

      const text =
        '📦 <b>Sua Coleção</b>\n\n' +
        categoryLines.join('\n') + '\n\n' +
        `<i>Total: ${ownedIds.size} sprite(s) coletado(s).</i>`;

      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ Voltar ao Perfil', callback_data: 'el_perfil' }]] },
      });
    } catch (error) {
      console.error('[ERROR] el_colecao:', error.message);
      await ctx.answerCbQuery('❌ Erro ao carregar coleção.', { show_alert: true });
    }
  });

// ─── Callback: el_gerar_imagem (Ação do botão global) ─────────────────────────
  
  bot.action('el_gerar_imagem', async (ctx) => {
    const userId = ctx.from?.id?.toString();
    console.log(`[LOG] Ação 'Gerar Imagem' acionada pelo usuário ${userId}`);
    
    try {
      // 1. Envia o Popup Modal que bloqueia a tela
      await ctx.answerCbQuery(
        '⏳ Gerando a imagem da sua coleção!\n\nIsso pode levar alguns minutos, basta aguardar a mensagem chegar no chat.', 
        { show_alert: true } 
      );
      
      const [categories, ownedIds, config] = await Promise.all([
        getElementalCategories(),
        getUserCollectionIds(userId),
        getUserElementalConfig(userId)
      ]);

      if (ownedIds.size === 0) {
        await ctx.reply('📦 <b>Sua Coleção</b>\n\nVocê ainda não marcou nenhum sprite. Use /elementais para explorar!', { parse_mode: 'HTML' });
        // Apaga a mensagem original do botão
        return await ctx.deleteMessage().catch(() => {});
      }

      const categoryLines = [];
      for (const cat of categories) {
        const variants = await getVariantsByCategory(cat.id_elemental_category);
        const owned = variants.filter(v => ownedIds.has(v.id_elemental_variant)).length;
        const total = variants.length;
        const bar = buildProgressBar(owned, total);
        categoryLines.push(`${catEmoji(cat.code)} <b>${cat.name}</b>  ${bar}  <i>${owned}/${total}</i>`);
      }

      const textLegenda = `📦 <b>Sua Coleção</b>\n\n${categoryLines.join('\n')}\n\n<i>Total: ${ownedIds.size} sprite(s) coletado(s).</i>`;
      const replyOptions = { caption: textLegenda, parse_mode: 'HTML' };

      // Se já tem em cache
      if (config.collection_image_id) {
        await ctx.replyWithPhoto(config.collection_image_id, replyOptions);
        // Apaga a mensagem original do botão
        return await ctx.deleteMessage().catch(() => {});
      }

      // Se vai gerar no Jimp
      const mosaicPath = await generateCollectionMosaic(userId);
      if (fs.existsSync(mosaicPath)) {
        const stats = fs.statSync(mosaicPath);
        const fileSizeInBytes = stats.size;
        const tenMegabytesInBytes = 10 * 1024 * 1024;

        let sentMsg;

        if (fileSizeInBytes > tenMegabytesInBytes) {
          sentMsg = await ctx.replyWithDocument(
            { source: fs.createReadStream(mosaicPath), filename: `colecao_${userId}.png` },
            replyOptions
          );
        } else {
          sentMsg = await ctx.replyWithPhoto(
            { source: fs.createReadStream(mosaicPath) },
            replyOptions
          );
        }

        if (sentMsg?.photo) {
          const uploadedFileId = sentMsg.photo[sentMsg.photo.length - 1].file_id;
          await updateUserElementalConfig(userId, { collection_image_id: uploadedFileId });
        }
        
        fs.unlinkSync(mosaicPath);
        // Apaga a mensagem original do botão
        await ctx.deleteMessage().catch(() => {});
      } else {
        await ctx.reply(textLegenda, { parse_mode: 'HTML' });
        // Apaga a mensagem original do botão
        await ctx.deleteMessage().catch(() => {});
      }
    } catch (error) {
      console.error('[ERROR] el_gerar_imagem:', error.message);
      await ctx.reply('❌ Ocorreu um erro ao gerar a imagem da coleção.');
    }
  });
};