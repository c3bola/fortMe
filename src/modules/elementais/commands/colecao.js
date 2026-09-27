'use strict';

const fs = require('fs');
const { ensureUser, ensureBotGroup } = require('../../../utils/databaseUtilsMySQL');
const catalogDb = require('../db/catalogDb');
const collectionDb = require('../db/collectionDb');
const uiService = require('../services/uiService');
const imageService = require('../services/imageService');
const { sendErrorLog } = require('../../../utils/logger');

module.exports = (bot) => {
  bot.command('colecao', async (ctx) => {
    const userIdStr = ctx.from?.id?.toString();
    const userName = ctx.from?.first_name || 'Colecionador';
    const replyId = ctx.message?.message_id;
    const args = ctx.message.text.split(/\s+/).slice(1).map(a => a.toLowerCase());

    let tempMsg;
    try {
      tempMsg = await ctx.reply(
        '⏳ <b>Processando sua coleção...</b>\n\nDevido ao tamanho do catálogo, isso pode levar um tempinho. O bot enviará a imagem assim que ela estiver pronta!',
        { parse_mode: 'HTML', reply_to_message_id: replyId }
      );

      await ensureUser(userIdStr, 1, { first_name: ctx.from.first_name, username: ctx.from.username });
      if (ctx.chat.type !== 'private') await ensureBotGroup(ctx.chat.id.toString(), ctx.chat.title || 'Grupo');

      // EXECUÇÃO EM BACKGROUND: Não usamos 'await' aqui para evitar o Timeout de 90s do Telegraf
      runCollectionInBackground(ctx, userIdStr, userName, replyId, args, tempMsg).catch(err => {
        console.error('[BACKGROUND ERROR] /colecao:', err);
      });

    } catch (error) {
      console.error('[ERROR] /colecao:', error);
      await sendErrorLog(ctx, 'Falha inicial no comando /colecao', error);
    }
  });

  // Função independente que faz o trabalho pesado sem travar o bot
  async function runCollectionInBackground(ctx, userIdStr, userName, replyId, args, tempMsg) {
    try {
      const [categories, ownedIds] = await Promise.all([
        catalogDb.getElementalCategories(),
        collectionDb.getUserCollectionIds(userIdStr)
      ]);

      const replyOptions = { parse_mode: 'HTML', reply_to_message_id: replyId };

      if (ownedIds.size === 0) {
        await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
        return await ctx.reply(`📦 <b>Coleção de ${userName}</b>\n\nVocê ainda não marcou nenhum sprite. Use /elementais para explorar!`, replyOptions);
      }

      let validCategoryCodes = null;
      let ignoredArgs = [];
      let filteredNames = [];

      if (args.length > 0) {
        validCategoryCodes = [];
        const matchedArgs = new Set();

        for (const cat of categories) {
          const catCode = cat.code.toLowerCase();
          const catName = cat.name.toLowerCase();
          const match = args.find(arg => catCode.includes(arg) || catName.includes(arg) || arg.includes(catCode) || arg.includes(catName.substring(0, 5)));

          if (match) {
            validCategoryCodes.push(cat.code);
            filteredNames.push(cat.name);
            matchedArgs.add(match);
          }
        }

        ignoredArgs = args.filter(arg => !matchedArgs.has(arg));

        if (validCategoryCodes.length === 0) {
          await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
          return await ctx.reply(`❌ Nenhuma categoria válida encontrada para: <b>${args.join(', ')}</b>.`, replyOptions);
        }
      }

      const categoryLines = [];
      let totalFiltrado = 0;

      for (const cat of categories) {
        if (validCategoryCodes && !validCategoryCodes.includes(cat.code)) continue;

        const variants = await catalogDb.getVariantsByCategory(cat.id_elemental_category);
        const owned = variants.filter(v => ownedIds.has(v.id_elemental_variant)).length;
        const total = variants.length;
        const bar = uiService.buildProgressBar(owned, total);

        categoryLines.push(`${uiService.catEmoji(cat.code)} <b>${cat.name}</b>  ${bar}  <i>${owned}/${total}</i>`);
        totalFiltrado += owned;
      }

      const titulo = validCategoryCodes ? `📦 <b>Coleção de ${userName} (${filteredNames.join(', ').toUpperCase()})</b>` : `📦 <b>Coleção de ${userName}</b>`;
      let textLegenda = `${titulo}\n\n${categoryLines.join('\n')}\n\n<i>Total exibido: ${totalFiltrado} sprite(s).</i>`;
      
      if (ignoredArgs.length > 0) textLegenda += `\n<tg-spoiler>Ignorados: ${ignoredArgs.join(', ')}</tg-spoiler>`;

      replyOptions.caption = textLegenda;
      
      const mosaicPath = await imageService.generateCollectionMosaic(userIdStr, validCategoryCodes);

      await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});

      if (mosaicPath && fs.existsSync(mosaicPath)) {
        const stats = fs.statSync(mosaicPath);
        const isDocument = stats.size > 10 * 1024 * 1024;
        
        await uiService.sendDocumentOrPhoto(ctx, mosaicPath, replyOptions, isDocument, userIdStr);
        fs.unlinkSync(mosaicPath);
      } else {
        await ctx.reply(textLegenda, replyOptions);
      }
      
    } catch (error) {
      console.error('[BACKGROUND ERROR] /colecao:', error.message);
      if (tempMsg) await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
      await ctx.reply('❌ Ocorreu um erro ao processar a imagem da sua coleção.', { reply_to_message_id: replyId });
      await sendErrorLog(ctx, 'Erro em background no mosaico /colecao', error);
    }
  }
};