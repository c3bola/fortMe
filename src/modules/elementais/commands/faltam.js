'use strict';

const fs = require('fs');
const { ensureUser, ensureBotGroup } = require('../../../utils/databaseUtilsMySQL');
const catalogDb = require('../db/catalogDb');
const collectionDb = require('../db/collectionDb');
const uiService = require('../services/uiService');
const imageService = require('../services/imageService');
const { sendErrorLog } = require('../../../utils/logger'); // Import do logger adicionado

module.exports = (bot) => {
  bot.command('faltam', async (ctx) => {
    const userIdStr = ctx.from?.id?.toString();
    const userName = ctx.from?.first_name || 'Colecionador';
    const replyId = ctx.message?.message_id;
    const args = ctx.message.text.split(/\s+/).slice(1).map(a => a.toLowerCase());

    let tempMsg;
    try {
      tempMsg = await ctx.reply(
        '⏳ <b>Analisando sua jornada...</b>\n\nA geração da imagem pode demorar um pouco. O bot fará isso em background e enviará em instantes!',
        { parse_mode: 'HTML', reply_to_message_id: replyId }
      );

      await ensureUser(userIdStr, 1, { first_name: ctx.from.first_name, username: ctx.from.username });
      if (ctx.chat.type !== 'private') await ensureBotGroup(ctx.chat.id.toString(), ctx.chat.title || 'Grupo');

      // Execução em background para evitar Timeout
      runMissingInBackground(ctx, userIdStr, userName, replyId, args, tempMsg).catch(err => {
        console.error('[BACKGROUND ERROR] /faltam:', err);
      });

    } catch (error) {
      console.error('[ERROR] /faltam:', error);
      await sendErrorLog(ctx, 'Falha inicial no comando /faltam', error);
      await ctx.reply('❌ Ocorreu um erro inesperado. O problema foi registrado e será corrigido em breve.', { reply_to_message_id: replyId });
    }
  });

  async function runMissingInBackground(ctx, userIdStr, userName, replyId, args, tempMsg) {
    try {
      const [categories, ownedIds, allVariants] = await Promise.all([
        catalogDb.getElementalCategories(),
        collectionDb.getUserCollectionIds(userIdStr),
        catalogDb.getAllVariants()
      ]);

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
          return await ctx.reply(`❌ Nenhuma categoria válida encontrada para: <b>${args.join(', ')}</b>.`, { parse_mode: 'HTML', reply_to_message_id: replyId });
        }
      }

      let missingActiveVariants = allVariants.filter(v => v.is_active === 1 && !ownedIds.has(v.id_elemental_variant));
      if (validCategoryCodes) {
        missingActiveVariants = missingActiveVariants.filter(v => validCategoryCodes.includes(v.category_code));
      }

      const missingCount = missingActiveVariants.length;

      if (missingCount === 0) {
        await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
        return await ctx.reply(
          validCategoryCodes
            ? `🏆 <b>Incrível, ${userName}!</b> Você já possui todos os elementais da(s) categoria(s) <b>${filteredNames.join(', ').toUpperCase()}</b>!`
            : `🏆 <b>Incrível, ${userName}! Parabéns!</b>\n\nVocê já obteve 100% dos elementais ativos no momento!\n\nAjude os demais membros da comunidade a completarem as suas coleções! 🤝`,
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      const categoryLines = [];
      for (const cat of categories) {
        if (cat.is_active !== 1) continue;
        if (validCategoryCodes && !validCategoryCodes.includes(cat.code)) continue;

        const variants = await catalogDb.getVariantsByCategory(cat.id_elemental_category);
        const ownedActive = variants.filter(v => v.is_active === 1 && ownedIds.has(v.id_elemental_variant)).length;
        const totalActive = variants.filter(v => v.is_active === 1).length;
        const missingActive = totalActive - ownedActive;

        if (missingActive > 0) {
          categoryLines.push(`${uiService.catEmoji(cat.code)} <b>${cat.name}</b>: <i>Faltam ${missingActive}</i>`);
        }
      }

      const titulo = validCategoryCodes ? `🎯 <b>Faltam para ${userName} (${filteredNames.join(', ').toUpperCase()})</b>` : `🎯 <b>O que falta para ${userName}</b>`;
      let textLegenda = `${titulo}\n\n${categoryLines.join('\n')}\n\n<i>Total: Ainda faltam ${missingCount} sprite(s) ativo(s).</i>`;
      
      if (ignoredArgs.length > 0) textLegenda += `\n<tg-spoiler>Ignorados: ${ignoredArgs.join(', ')}</tg-spoiler>`;

      const replyOptions = { parse_mode: 'HTML', caption: textLegenda, reply_to_message_id: replyId };
      const mosaicPath = await imageService.generateMissingMosaic(userIdStr, validCategoryCodes);

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
      console.error('[BACKGROUND ERROR] /faltam:', error.message);
      if (tempMsg) await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
      await ctx.reply('❌ Erro ao compor mosaico dos elementais faltantes.', { reply_to_message_id: replyId });
      await sendErrorLog(ctx, 'Erro em background no mosaico /faltam', error);
    }
  }
};