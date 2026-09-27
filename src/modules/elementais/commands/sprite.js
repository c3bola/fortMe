'use strict';

const path = require('path');
const fs = require('fs');

const { ensureUser, ensureBotGroup } = require('../../../utils/databaseUtilsMySQL');
const catalogDb = require('../db/catalogDb');
const collectionDb = require('../db/collectionDb');
const uiService = require('../services/uiService');
const imageService = require('../services/imageService');
const { sendErrorLog } = require('../../../utils/logger');

module.exports = (bot) => {
  // ─── Comando: /sprite <nome> ───────────────────────────────────────────────────

  bot.command('sprite', async (ctx) => {
    const args = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    const replyId = ctx.message?.message_id;

    try {
      if (!args) {
        return ctx.reply(
          '🔍 <b>Busca de Sprite</b>\n\n' +
          'Informe o nome do sprite que deseja buscar:\n' +
          '<code>/sprite Duck</code>',
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      const sprites = await catalogDb.getSpritesByName(args);

      if (sprites.length === 0) {
        return ctx.reply(
          `🔍 Nenhum sprite encontrado para <b>${args}</b> na temporada atual.\n\n` +
          'Verifique o nome e tente novamente.',
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      const sprite = sprites[0];
      const variants = await catalogDb.getVariantsBySpriteId(sprite.id_elemental_sprite);

      if (variants.length === 0) {
        return ctx.reply(
          `⚠️ O sprite <b>${sprite.name}</b> não possui variantes ativas nesta temporada.`,
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      const defaultVariant = variants.find(v => v.category_name?.toLowerCase() === 'basic') || variants[0];
      const otherVariants = variants.filter(v => v.id_elemental_variant !== defaultVariant.id_elemental_variant);

      const flatButtons = otherVariants.map(v => ({
        text: `${uiService.catEmoji(v.category_code)} ${v.category_name}`,
        callback_data: `el_spvar_${v.id_elemental_variant}`
      }));

      const buttonRows = uiService.chunkButtons(flatButtons, 2);

      const variantDetails = await catalogDb.getVariantById(defaultVariant.id_elemental_variant);
      const caption = uiService.buildVariantCaption(variantDetails);
      const keyboard = buttonRows.length > 0 ? { inline_keyboard: buttonRows } : undefined;

      let fileToSend = null;
      // Validação de File ID do Telegram (sem extensão)
      const isTelegramFileId = variantDetails.image && !variantDetails.image.includes('.');

      if (variantDetails.telegram_file_id) {
        fileToSend = variantDetails.telegram_file_id;
      } else if (isTelegramFileId) {
        fileToSend = variantDetails.image; 
      } else if (variantDetails.image) {
        const tempMsg = await ctx.reply('⏳ <i>Gerando imagem...</i>', { parse_mode: 'HTML', reply_to_message_id: replyId });

        try {
          const imageBuffer = await imageService.buildIndividualCard(
            variantDetails.sprite_name,
            variantDetails.category_code,
            variantDetails.category_name,
            path.basename(variantDetails.image),
            null, 
            true  
          );
          // Força a conversão do array para Buffer nativo
          fileToSend = { source: Buffer.from(imageBuffer) };
        } catch (err) {
          console.error('[ERROR] Falha ao gerar card individual:', err.message);
        }

        await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => { });
      }

      if (fileToSend) {
        return ctx.replyWithPhoto(fileToSend, {
          caption,
          parse_mode: 'HTML',
          reply_markup: keyboard,
          reply_to_message_id: replyId
        });
      }

      const textCaption = variantDetails.image ? `${caption}\n\n⚠️ <i>Imagem não disponível.</i>` : caption;
      return ctx.reply(textCaption, { parse_mode: 'HTML', reply_markup: keyboard, reply_to_message_id: replyId });

    } catch (error) {
      console.error('[ERROR] /sprite:', error);
      await sendErrorLog(ctx, 'Falha na execução do comando /sprite', error);
      await ctx.reply('❌ Erro ao buscar o sprite. O problema foi registrado.', { reply_to_message_id: replyId });
    }
  });

  // ─── Action: Alternar Variante (Botões das Categorias) ───────────────────────

  bot.action(/^el_spvar_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);

    try {
      const variantDetails = await catalogDb.getVariantById(variantId);
      const caption = uiService.buildVariantCaption(variantDetails);

      const allVariants = await catalogDb.getVariantsBySpriteId(variantDetails.fk_id_sprite);
      const otherVariants = allVariants.filter(v => v.id_elemental_variant !== variantId);

      const flatButtons = otherVariants.map(v => ({
        text: `${uiService.catEmoji(v.category_code)} ${v.category_name}`,
        callback_data: `el_spvar_${v.id_elemental_variant}`
      }));

      const buttonRows = uiService.chunkButtons(flatButtons, 2);
      const keyboard = buttonRows.length > 0 ? { inline_keyboard: buttonRows } : undefined;

      let media = null;
      const isTelegramFileId = variantDetails.image && !variantDetails.image.includes('.');

      if (variantDetails.telegram_file_id) {
        media = { type: 'photo', media: variantDetails.telegram_file_id, caption: caption, parse_mode: 'HTML' };
      } else if (isTelegramFileId) {
        media = { type: 'photo', media: variantDetails.image, caption: caption, parse_mode: 'HTML' };
      } else if (variantDetails.image) {
        try {
          const imageBuffer = await imageService.buildIndividualCard(
            variantDetails.sprite_name,
            variantDetails.category_code,
            variantDetails.category_name,
            path.basename(variantDetails.image),
            null,
            true 
          );
          media = { type: 'photo', media: { source: Buffer.from(imageBuffer) }, caption: caption, parse_mode: 'HTML' };
        } catch (err) {
          console.error('[ERROR] Falha ao gerar card individual da variante:', err.message);
        }
      }

      if (media) {
        await ctx.editMessageMedia(media, { reply_markup: keyboard }).catch(() => { });
      } else {
        const textCaption = variantDetails.image ? `${caption}\n\n⚠️ <i>Imagem não disponível.</i>` : caption;
        await ctx.editMessageText(textCaption, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => { });
      }

      await ctx.answerCbQuery();

    } catch (error) {
      console.error('[ERROR] el_var:', error);
      await sendErrorLog(ctx, 'Falha ao trocar variante do sprite', error);
      await ctx.answerCbQuery('❌ Erro ao carregar a variante.', { show_alert: true });
    }
  });

  bot.action(/^el_back_spr_(\d+)$/, async (ctx) => { await ctx.answerCbQuery(); });
};