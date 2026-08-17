'use strict';

const path = require('path');
const fs = require('fs');

const {
  ensureUser,
  ensureBotGroup,
  getElementalCategories,
  getVariantById,
  getVariantsBySpriteId,
  getSpritesByName,
  hasVariantInCollection
} = require('../../utils/databaseUtilsMySQL');

const {
  IMAGES_BASE,
  catEmoji,
  buildVariantCaption,
  chunkButtons
} = require('./elementalCommon');

module.exports = (bot) => {
  // ─── Comando: /sprite <nome> ───────────────────────────────────────────────────

  bot.command('sprite', async (ctx) => {
    const args = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
    const replyId = ctx.message?.message_id;

    try {
      // ... (suas validações ensureUser e ensureBotGroup continuam iguais aqui) ...

      if (!args) {
        return ctx.reply(
          '🔍 <b>Busca de Sprite</b>\n\n' +
          'Informe o nome do sprite que deseja buscar:\n' +
          '<code>/sprite Duck</code>',
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      const sprites = await getSpritesByName(args);

      if (sprites.length === 0) {
        return ctx.reply(
          `🔍 Nenhum sprite encontrado para <b>${args}</b>.\n\n` +
          'Verifique o nome e tente novamente.',
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      const sprite = sprites[0];
      const variants = await getVariantsBySpriteId(sprite.id_elemental_sprite);

      if (variants.length === 0) {
        return ctx.reply(
          `⚠️ O sprite <b>${sprite.name}</b> ainda não possui variantes cadastradas.`,
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      // Tenta achar a variante Basic. Se não achar pelo nome, pega a primeira [0]
      const defaultVariant = variants.find(v => v.category_name?.toLowerCase() === 'basic') || variants[0];

      // Filtra as OUTRAS variantes para gerar os botões
      const otherVariants = variants.filter(v => v.id_elemental_variant !== defaultVariant.id_elemental_variant);

      // 1. Cria uma lista plana (REPARE: sem colchetes em volta das chaves)
      const flatButtons = otherVariants.map(v => ({
        text: `${catEmoji(v.category_code)} ${v.category_name}`, 
        callback_data: `el_spvar_${v.id_elemental_variant}`
      }));

      // 2. Divide em 2 colunas usando a função
      const buttonRows = chunkButtons(flatButtons, 2);

      // Busca os detalhes completos da variante...
      const variantDetails = await getVariantById(defaultVariant.id_elemental_variant);
      const caption = buildVariantCaption(variantDetails);

      // Lógica de envio (File ID > Disco)
      let fileToSend = null;
      if (variantDetails.telegram_file_id) {
        fileToSend = variantDetails.telegram_file_id;
      } else if (variantDetails.image) {
        const imagePath = path.join(IMAGES_BASE, variantDetails.image);
        if (fs.existsSync(imagePath)) {
          fileToSend = { source: fs.createReadStream(imagePath) };
        }
      }

      const keyboard = buttonRows.length > 0 ? { inline_keyboard: buttonRows } : undefined;

      if (fileToSend) {
        return ctx.replyWithPhoto(
          fileToSend,
          {
            caption,
            parse_mode: 'HTML',
            reply_markup: keyboard,
            reply_to_message_id: replyId
          }
        );
      }

      // Fallback sem imagem
      const textCaption = variantDetails.image ? `${caption}\n\n⚠️ <i>Imagem não disponível.</i>` : caption;
      return ctx.reply(textCaption, { parse_mode: 'HTML', reply_markup: keyboard, reply_to_message_id: replyId });

    } catch (error) {
      console.error('[ERROR] /sprite:', error.message);
      await ctx.reply('❌ Erro ao buscar o sprite. Tente novamente.', { reply_to_message_id: replyId });
    }
  });

  // ─── Action: Alternar Variante (Botões das Categorias) ───────────────────────

  bot.action(/^el_spvar_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);

    try {
      const variantDetails = await getVariantById(variantId);
      const caption = buildVariantCaption(variantDetails);

      // Busca todas as variantes desse sprite para reconstruir os botões
      const allVariants = await getVariantsBySpriteId(variantDetails.fk_id_sprite); // Ajuste o campo fk_id_sprite se no seu banco chamar diferente

      // Cria botões de todas as variantes, EXCETO a que está sendo exibida agora
      const otherVariants = allVariants.filter(v => v.id_elemental_variant !== variantId);
      
      // 1. Cria a lista plana (sem colchetes)
      const flatButtons = otherVariants.map(v => ({
        text: `${catEmoji(v.category_code)} ${v.category_name}`,
        callback_data: `el_spvar_${v.id_elemental_variant}`
      }));

      // 2. Divide a lista em linhas com máximo de 2 colunas
      const buttonRows = chunkButtons(flatButtons, 2);

      // 3. Monta o teclado
      const keyboard = buttonRows.length > 0 ? { inline_keyboard: buttonRows } : undefined;

      let media = null;
      if (variantDetails.telegram_file_id) {
        media = { type: 'photo', media: variantDetails.telegram_file_id, caption: caption, parse_mode: 'HTML' };
      } else if (variantDetails.image) {
        const imagePath = path.join(IMAGES_BASE, variantDetails.image);
        if (fs.existsSync(imagePath)) {
          media = { type: 'photo', media: { source: fs.createReadStream(imagePath) }, caption: caption, parse_mode: 'HTML' };
        }
      }

      // Se temos mídia, editamos a imagem e a legenda
      if (media) {
        await ctx.editMessageMedia(media, { reply_markup: keyboard });
      } else {
        // Se a nova variante não tiver imagem, editamos apenas o texto (vai remover a foto da msg)
        const textCaption = variantDetails.image ? `${caption}\n\n⚠️ <i>Imagem não disponível.</i>` : caption;
        await ctx.editMessageText(textCaption, { parse_mode: 'HTML', reply_markup: keyboard });
      }

      await ctx.answerCbQuery(); // Finaliza o loading do botão no Telegram

    } catch (error) {
      console.error('[ERROR] el_var:', error.message);
      await ctx.answerCbQuery('❌ Erro ao carregar a variante.', { show_alert: true });
    }
  });

  // ─── Stubs — ETAPAs futuras ───────────────────────────────────────────────────


  // el_back_spr_{id}: voltar ao perfil do sprite (ETAPA futura)
  bot.action(/^el_back_spr_(\d+)$/, async (ctx) => { await ctx.answerCbQuery(); });
};