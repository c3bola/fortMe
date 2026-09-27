'use strict';

const path = require('path');
const fs = require('fs');

const { ensureUser } = require('../../../utils/databaseUtilsMySQL');
const catalogDb = require('../db/catalogDb');
const collectionDb = require('../db/collectionDb');
const socialDb = require('../db/socialDb');

const imageService = require('../services/imageService');
const uiService = require('../services/uiService');
const { sendErrorLog } = require('../../../utils/logger'); 

const IMAGES_BASE = path.join(__dirname, '../../../../assets/images/');

// ─── HELPERS PARA MENSAGENS EFÊMERAS (Bot API 10.2+) ─────────────────────────

async function deleteEphemeralOrNormal(ctx) {
  const ephemeralId = ctx.callbackQuery?.message?.ephemeral_message_id;
  if (ephemeralId) {
    return ctx.telegram.callApi('deleteEphemeralMessage', {
      chat_id: ctx.chat.id,
      receiver_user_id: ctx.from.id,
      ephemeral_message_id: ephemeralId
    }).catch(() => {});
  }
  return ctx.deleteMessage().catch(() => {});
}

async function sendEphemeralOrNormalText(ctx, text, keyboard, isEdit, replyId = null) {
  const isGroup = ctx.chat?.type !== 'private';
  const ephemeralId = ctx.callbackQuery?.message?.ephemeral_message_id;
  const userId = ctx.from.id;

  if (isGroup) {
    if (isEdit && ephemeralId) {
      return ctx.telegram.callApi('editEphemeralMessageText', {
        chat_id: ctx.chat.id,
        receiver_user_id: userId,
        ephemeral_message_id: ephemeralId,
        text,
        parse_mode: 'HTML',
        reply_markup: keyboard
      }).catch(() => {});
    } else {
      // Uso estrito do callApi para mensagens efêmeras puras
      return ctx.telegram.callApi('sendMessage', {
        chat_id: ctx.chat.id,
        receiver_user_id: userId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: keyboard
      }).catch(err => console.error('[ERROR] sendMessage efêmera:', err.message));
    }
  } else {
    if (isEdit) {
      return ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
    } else {
      return ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard, ...(replyId && { reply_to_message_id: replyId }) });
    }
  }
}

async function sendOrEditMedia(ctx, mediaPayload, caption, keyboard, isNewMessage) {
  const isGroup = ctx.chat?.type !== 'private';
  const userId = ctx.from.id;

  if (isGroup) {
    if (!isNewMessage) await deleteEphemeralOrNormal(ctx);
    
    return ctx.telegram.sendPhoto(ctx.chat.id, mediaPayload, {
      receiver_user_id: userId,
      caption,
      parse_mode: 'HTML',
      reply_markup: keyboard
    }).catch(err => console.error('[ERROR] sendPhoto efêmera:', err.message));
  } else {
    if (isNewMessage) {
      await ctx.deleteMessage().catch(() => {});
      return ctx.replyWithPhoto(mediaPayload, { caption, parse_mode: 'HTML', reply_markup: keyboard });
    } else {
      return ctx.editMessageMedia(
        { type: 'photo', media: mediaPayload, caption: caption, parse_mode: 'HTML' },
        { reply_markup: keyboard }
      ).catch(() => {});
    }
  }
}

// ─── REPLICAÇÃO LOCAL DOS MENUS PARA SUPORTE EFÊMERO ─────────────────────────

async function sendLocalCategoryMenu(ctx, isEdit) {
  const categories = await catalogDb.getElementalCategories();
  
  if (categories.length === 0) {
    return sendEphemeralOrNormalText(ctx, '❌ Nenhuma categoria disponível no momento.', null, isEdit);
  }

  const text = '🌟 <b>Sprites Elementais</b>\n\nEscolha uma categoria para explorar:';
  const inline_keyboard = categories.map(c => [{
    text: `${uiService.catEmoji(c.code)} ${c.name}`,
    callback_data: `el_cat_${c.id_elemental_category}`
  }]);

  inline_keyboard.push([{ text: '🖼️ Gerar imagem da coleção', callback_data: 'el_updatemosaic' }]);
  inline_keyboard.push([
    { text: '🔙 Voltar aos Modos', callback_data: 'el_mode_select' },
    { text: '🗑️ Fechar', callback_data: 'el_close' }
  ]);

  await sendEphemeralOrNormalText(ctx, text, { inline_keyboard }, isEdit);
}

async function sendLocalSpriteList(ctx, categoryId, isEdit, userId) {
  const [categories, variants] = await Promise.all([
    catalogDb.getElementalCategories(),
    catalogDb.getVariantsByCategory(categoryId),
  ]);

  const category = categories.find(c => c.id_elemental_category == categoryId);
  const kbBack = { inline_keyboard: [[{ text: '⬅️ Categorias', callback_data: 'el_back_cat' }]] };

  if (!category) return sendEphemeralOrNormalText(ctx, '❌ Categoria não encontrada.', kbBack, isEdit);

  const ownedIds = await collectionDb.getUserCollectionIds(userId);
  const dominatedIds = await collectionDb.getUserDominatedIds(userId);

  const emoji = uiService.catEmoji(category.code);
  const owned = variants.filter(v => ownedIds.has(v.id_elemental_variant)).length;

  const text =
    `${emoji} <b>${category.name}</b>\n` +
    `<i>${variants.length} sprite(s) — ${owned} na sua coleção</i>\n\n` +
    'Toque no nome para ver a ficha, no ✅ para colecionar, ou na 👑 para dominar:';

  const spriteButtons = variants.map(v => {
    const has = ownedIds.has(v.id_elemental_variant);
    const isDominated = dominatedIds.has(v.id_elemental_variant);
    
    return [
      { text: v.sprite_name, callback_data: `el_var_${v.id_elemental_variant}` },
      { text: has ? '✅' : '☑️', callback_data: `el_chk_${v.id_elemental_variant}_${categoryId}` },
      { text: has ? (isDominated ? '👑' : '➖') : '➖', callback_data: `el_dom_${v.id_elemental_variant}_${categoryId}` }
    ];
  });

  spriteButtons.push([{ text: '🖼️ Gerar imagem da coleção', callback_data: 'el_updatemosaic' }]);
  spriteButtons.push([
    { text: '⬅️ Categorias', callback_data: 'el_back_cat' },
    { text: '🗑️ Fechar', callback_data: 'el_close' }
  ]);

  await sendEphemeralOrNormalText(ctx, text, { inline_keyboard: spriteButtons }, isEdit);
}

// ─── MÓDULO PRINCIPAL ────────────────────────────────────────────────────────

module.exports = (bot) => {

  bot.action('el_close', async (ctx) => {
    await deleteEphemeralOrNormal(ctx);
  });

  async function handleCatalogCommand(ctx) {
    try {
      if (ctx.chat.type !== 'private') {
        try { await ctx.deleteMessage(); } catch (_) {}
      }

      await ensureUser(ctx.from.id.toString(), 1, {
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
      });

      const keyboard = {
        inline_keyboard: [
          [{ text: '📝 Ver como Lista (Múltipla Seleção)', callback_data: 'el_mode_list' }],
          [{ text: '🖼️ Ver como Galeria (Detalhes & Imagens)', callback_data: 'el_mode_gal' }],
          [{ text: '🗑️ Fechar', callback_data: 'el_close' }]
        ]
      };

      const mention = `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>`;
      const promptText = `👤 ${mention}\n\n<b>Como você quer explorar seus Elementais?</b>`;

      await sendEphemeralOrNormalText(
        ctx, 
        promptText, 
        keyboard, 
        false
      );
      
    } catch (error) {
      console.error('[ERROR] Elementais comando:', error);
      await sendErrorLog(ctx, 'Falha no comando /elementais', error);
      
      const msg = '❌ Erro ao carregar o catálogo. Tente novamente.';
      if (ctx.chat.type !== 'private') {
        await ctx.telegram.callApi('sendMessage', { chat_id: ctx.chat.id, receiver_user_id: ctx.from.id, text: msg });
      } else {
        await ctx.reply(msg);
      }
    }
  }

  bot.command('elementais', handleCatalogCommand);
  bot.command('sprites', handleCatalogCommand);

  bot.action('el_mode_list', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await sendLocalCategoryMenu(ctx, true);
    } catch (error) {
      await sendErrorLog(ctx, 'Erro ao abrir modo lista', error);
    }
  });

  bot.action('el_mode_select', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const keyboard = {
        inline_keyboard: [
          [{ text: '📝 Ver como Lista (Múltipla Seleção)', callback_data: 'el_mode_list' }],
          [{ text: '🖼️ Ver como Galeria (Detalhes & Imagens)', callback_data: 'el_mode_gal' }],
          [{ text: '🗑️ Fechar', callback_data: 'el_close' }]
        ]
      };
      
      const mention = `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>`;
      const promptText = `👤 ${mention}\n\n<b>Como você quer explorar seus Elementais?</b>`;

      const isPhoto = !!(ctx.callbackQuery?.message?.photo);
      if (isPhoto) {
        await deleteEphemeralOrNormal(ctx);
        await sendEphemeralOrNormalText(ctx, promptText, keyboard, false);
      } else {
        await sendEphemeralOrNormalText(ctx, promptText, keyboard, true);
      }
    } catch (error) {
      await sendErrorLog(ctx, 'Erro ao voltar para seleção de modo', error);
    }
  });

  bot.action('el_mode_gal', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const categories = await catalogDb.getElementalCategories();
      
      const keyboard = { inline_keyboard: [] };
      for (let i = 0; i < categories.length; i += 2) {
        const row = [];
        row.push({ text: categories[i].name, callback_data: `el_galcat_${categories[i].id_elemental_category}` });
        if (categories[i+1]) row.push({ text: categories[i+1].name, callback_data: `el_galcat_${categories[i+1].id_elemental_category}` });
        keyboard.inline_keyboard.push(row);
      }
      keyboard.inline_keyboard.push([
        { text: '🔙 Voltar aos Modos', callback_data: 'el_mode_select' },
        { text: '🗑️ Fechar', callback_data: 'el_close' }
      ]);

      const txt = '🖼️ <b>Modo Galeria:</b>\nEscolha uma categoria para visualizar as cartas em detalhes.';
      const isPhoto = !!(ctx.callbackQuery?.message?.photo);
      
      if (isPhoto) {
        await deleteEphemeralOrNormal(ctx);
        await sendEphemeralOrNormalText(ctx, txt, keyboard, false);
      } else {
        await sendEphemeralOrNormalText(ctx, txt, keyboard, true);
      }
    } catch (error) {
      console.error('[ERROR] el_mode_gal:', error);
      await sendErrorLog(ctx, 'Erro ao abrir modo galeria', error);
      await ctx.answerCbQuery('❌ Erro.', { show_alert: true });
    }
  });

  async function renderGalleryFrame(ctx, categoryId, index, userId, isNewMessage) {
    try {
      const variants = await catalogDb.getVariantsByCategory(categoryId);

      if (variants.length === 0) {
        return ctx.answerCbQuery('❌ Categoria vazia.', { show_alert: true });
      }

      if (index < 0) index = 0;
      if (index >= variants.length) index = variants.length - 1;

      const variant = variants[index];
      const owned = await collectionDb.hasVariantInCollection(userId, variant.id_elemental_variant);
      
      let isDominated = false;
      if(owned) {
          const domIds = await collectionDb.getUserDominatedIds(userId);
          isDominated = domIds.has(variant.id_elemental_variant);
      }

      const maxIdx = variants.length - 1;
      const prevIdx = index > 0 ? index - 1 : 0;
      const nextIdx = index < maxIdx ? index + 1 : maxIdx;

      const navRow = [
        { text: '⏮️', callback_data: index === 0 ? 'noop' : `el_gal_${categoryId}_0` },
        { text: '◀️', callback_data: index === 0 ? 'noop' : `el_gal_${categoryId}_${prevIdx}` },
        { text: `${index + 1} / ${variants.length}`, callback_data: 'noop' },
        { text: '▶️', callback_data: index === maxIdx ? 'noop' : `el_gal_${categoryId}_${nextIdx}` },
        { text: '⏭️', callback_data: index === maxIdx ? 'noop' : `el_gal_${categoryId}_${maxIdx}` }
      ];

      const toggleBtn = owned
        ? { text: '❌ Remover', callback_data: `el_galtog_${categoryId}_${index}_${variant.id_elemental_variant}` }
        : { text: '✅ Marcar Obtido', callback_data: `el_galtog_${categoryId}_${index}_${variant.id_elemental_variant}` };

      const domBtn = isDominated
        ? { text: '⬛ Remover Dominação', callback_data: `el_galdom_${categoryId}_${index}_${variant.id_elemental_variant}` }
        : { text: '👑 Dominar', callback_data: `el_galdom_${categoryId}_${index}_${variant.id_elemental_variant}` };

      const keyboard = {
        inline_keyboard: [
          navRow,
          [toggleBtn, domBtn],
          [
            { text: '⬅️ Voltar', callback_data: 'el_mode_gal' },
            { text: '🗑️ Fechar', callback_data: 'el_close' }
          ]
        ]
      };

      const caption = uiService.buildVariantCaption(variant);
      const mediaId = variant.telegram_file_id || variant.file_id; 

      if (mediaId) {
        await sendOrEditMedia(ctx, mediaId, caption, keyboard, isNewMessage);
      } else {
        const imagePath = variant.image ? path.join(IMAGES_BASE, 'elementais', path.basename(variant.image)) : null;
        if (imagePath && fs.existsSync(imagePath)) {
          await sendOrEditMedia(ctx, { source: fs.createReadStream(imagePath) }, caption, keyboard, isNewMessage);
        } else {
          if (isNewMessage) await deleteEphemeralOrNormal(ctx);
          await sendEphemeralOrNormalText(ctx, caption + '\n\n⚠️ <i>Imagem indisponível.</i>', keyboard, !isNewMessage);
        }
      }
    } catch (e) {
      console.error('[ERROR] renderGalleryFrame:', e);
      await sendErrorLog(ctx, 'Erro ao renderizar frame da galeria', e);
      await ctx.answerCbQuery('Erro ao carregar a galeria.', { show_alert: true });
    }
  }

  bot.action('noop', async (ctx) => { await ctx.answerCbQuery().catch(()=>{}); });

  bot.action(/^el_galcat_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id?.toString();
    await ctx.answerCbQuery('Carregando galeria...');
    await renderGalleryFrame(ctx, categoryId, 0, userId, true);
  });

  bot.action(/^el_gal_(\d+)_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const index = parseInt(ctx.match[2]);
    const userId = ctx.from?.id?.toString();
    await ctx.answerCbQuery();
    await renderGalleryFrame(ctx, categoryId, index, userId, false);
  });

  bot.action(/^el_galtog_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const index = parseInt(ctx.match[2]);
    const variantId = parseInt(ctx.match[3]);
    const userId = ctx.from?.id?.toString();

    try {
      const nowOwned = await collectionDb.toggleVariantInCollection(userId, variantId);
      if (socialDb && socialDb.updateUserElementalConfig) {
          await socialDb.updateUserElementalConfig(userId, { collection_image_id: null });
      }
      
      const toast = nowOwned ? '✅ Adicionado à coleção!' : '❌ Removido da coleção.';
      await ctx.answerCbQuery(toast, { show_alert: false });

      await renderGalleryFrame(ctx, categoryId, index, userId, false);

      const promptText = '🔄 <b>Sua coleção mudou!</b>\nDeseja gerar a nova imagem da sua coleção com as atualizações?';
      const promptKb = { inline_keyboard: [[
        { text: '✅ Sim, gerar mosaico', callback_data: `el_updatemosaic` },
        { text: '❌ Deixar para depois', callback_data: `el_ignoraremosaic` }
      ]]};

      if (ctx.chat.type !== 'private') {
        await ctx.telegram.callApi('sendMessage', { chat_id: ctx.chat.id, receiver_user_id: userId, text: promptText, parse_mode: 'HTML', reply_markup: promptKb });
      } else {
        await ctx.reply(promptText, { parse_mode: 'HTML', reply_markup: promptKb });
      }

    } catch (e) {
      console.error('[ERROR] el_galtog:', e);
      await sendErrorLog(ctx, 'Erro ao alternar posse de carta (Galeria)', e);
      await ctx.answerCbQuery('Erro ao atualizar coleção.', { show_alert: true });
    }
  });

  bot.action(/^el_galdom_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const index = parseInt(ctx.match[2]);
    const variantId = parseInt(ctx.match[3]);
    const userId = ctx.from?.id?.toString();

    try {
      const isNowDominated = await collectionDb.toggleVariantDomination(userId, variantId);
      const toast = isNowDominated ? '👑 Sprite dominado com sucesso!' : '⬛ Marcação de dominação removida.';
      await ctx.answerCbQuery(toast, { show_alert: false });
      await renderGalleryFrame(ctx, categoryId, index, userId, false);
    } catch (error) {
      console.error('[ERROR] el_galdom:', error);
      if (error.message === 'NOT_IN_COLLECTION') {
        await ctx.answerCbQuery('❌ Você precisa ter o sprite na coleção para dominá-lo!', { show_alert: true });
      } else {
        await sendErrorLog(ctx, 'Erro ao dominar sprite (Galeria)', error);
        await ctx.answerCbQuery('❌ Erro técnico ao processar dominação.', { show_alert: true });
      }
    }
  });

  bot.action(/^el_cat_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id?.toString();
    try {
      await ctx.answerCbQuery();
      const isPhoto = !!(ctx.callbackQuery?.message?.photo);
      
      if (isPhoto) {
        await deleteEphemeralOrNormal(ctx);
        await sendLocalSpriteList(ctx, categoryId, false, userId);
      } else {
        await sendLocalSpriteList(ctx, categoryId, true, userId);
      }
    } catch (error) {
      console.error('[ERROR] el_cat:', error);
      await sendErrorLog(ctx, 'Erro ao carregar lista de sprites da categoria', error);
      await ctx.answerCbQuery('❌ Erro ao carregar sprites.', { show_alert: true });
    }
  });

  bot.action(/^el_chk_(\d+)_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const categoryId = parseInt(ctx.match[2]);
    const userId = ctx.from?.id?.toString();

    try {
      const nowOwned = await collectionDb.toggleVariantInCollection(userId, variantId);
      if (socialDb && socialDb.updateUserElementalConfig) {
          await socialDb.updateUserElementalConfig(userId, { collection_image_id: null });
      }
      const toast = nowOwned ? '✅ Adicionado à coleção!' : '❌ Removido da coleção.';
      await ctx.answerCbQuery(toast, { show_alert: false });
      await sendLocalSpriteList(ctx, categoryId, true, userId);
    } catch (error) {
      console.error('[ERROR] el_chk:', error);
      await sendErrorLog(ctx, 'Erro ao alternar posse de carta (Lista)', error);
      await ctx.answerCbQuery('❌ Erro ao atualizar coleção.', { show_alert: true });
    }
  });

  bot.action(/^el_dom_(\d+)_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const categoryId = parseInt(ctx.match[2]);
    const userId = ctx.from?.id?.toString();

    try {
      const isNowDominated = await collectionDb.toggleVariantDomination(userId, variantId);
      const toast = isNowDominated ? '👑 Sprite dominado com sucesso!' : '⬛ Marcação de dominação removida.';
      await ctx.answerCbQuery(toast, { show_alert: false });
      await sendLocalSpriteList(ctx, categoryId, true, userId);
    } catch (error) {
      console.error('[ERROR] el_dom:', error);
      if (error.message === 'NOT_IN_COLLECTION') {
        await ctx.answerCbQuery('❌ Você precisa ter o sprite na coleção para dominá-lo!', { show_alert: true });
      } else {
        await sendErrorLog(ctx, 'Erro ao dominar sprite (Lista)', error);
        await ctx.answerCbQuery('❌ Erro técnico ao processar dominação.', { show_alert: true });
      }
    }
  });

  bot.action(/^el_back_cat$/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await sendLocalCategoryMenu(ctx, true);
    } catch (error) {
      console.error('[ERROR] el_back_cat:', error);
      await sendErrorLog(ctx, 'Erro ao voltar para categorias', error);
      await ctx.answerCbQuery('❌ Erro.', { show_alert: true });
    }
  });

  bot.action(/^el_var_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id?.toString();
    try {
      await ctx.answerCbQuery();

      const [variant, owned] = await Promise.all([
        catalogDb.getVariantById(variantId),
        collectionDb.hasVariantInCollection(userId, variantId),
      ]);

      if (!variant) return ctx.answerCbQuery('❌ Sprite não encontrado.', { show_alert: true });

      const caption = uiService.buildVariantCaption(variant);
      const toggleBtn = owned
        ? { text: '❌ Remover da coleção', callback_data: `el_toggle_${variantId}` }
        : { text: '✅ Tenho este sprite!', callback_data: `el_toggle_${variantId}` };

      const keyboard = { inline_keyboard: [ [toggleBtn], [{ text: `⬅️ ${variant.category_name}`, callback_data: `el_cat_${variant.fk_id_category}` }] ] };
      
      const mediaId = variant.telegram_file_id || variant.file_id;
      
      if (mediaId) {
        await sendOrEditMedia(ctx, mediaId, caption, keyboard, true);
      } else {
        const imagePath = variant.image ? path.join(IMAGES_BASE, 'elementais', path.basename(variant.image)) : null;
        if (imagePath && fs.existsSync(imagePath)) {
          await sendOrEditMedia(ctx, { source: fs.createReadStream(imagePath) }, caption, keyboard, true);
        } else {
          const textCaption = variant.image ? `${caption}\n\n⚠️ <i>Imagem não disponível.</i>` : caption;
          await deleteEphemeralOrNormal(ctx);
          await sendEphemeralOrNormalText(ctx, textCaption, keyboard, false);
        }
      }
    } catch (error) {
      console.error('[ERROR] el_var:', error);
      await sendErrorLog(ctx, 'Erro ao abrir ficha do elemental', error);
      await ctx.answerCbQuery('❌ Erro ao carregar ficha.', { show_alert: true });
    }
  });

  bot.action(/^el_toggle_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id?.toString();
    try {
      const variant = await catalogDb.getVariantById(variantId);
      if (!variant) return ctx.answerCbQuery('❌ Sprite não encontrado.', { show_alert: true });

      const nowOwned = await collectionDb.toggleVariantInCollection(userId, variantId);
      if (socialDb && socialDb.updateUserElementalConfig) {
          await socialDb.updateUserElementalConfig(userId, { collection_image_id: null });
      }

      const promptText = '🔄 <b>Sua coleção foi atualizada!</b>\nDeseja gerar a nova imagem da sua coleção agora?';
      const promptKb = { inline_keyboard: [[
        { text: '✅ Sim, gerar agora', callback_data: `el_updatemosaic` },
        { text: '❌ Deixar para depois', callback_data: `el_ignoraremosaic` }
      ]]};

      if (ctx.chat.type !== 'private') {
        await ctx.telegram.callApi('sendMessage', { chat_id: ctx.chat.id, receiver_user_id: userId, text: promptText, parse_mode: 'HTML', reply_markup: promptKb });
      } else {
        await ctx.reply(promptText, { parse_mode: 'HTML', reply_markup: promptKb });
      }

      const toast = nowOwned ? `✅ ${variant.sprite_name} adicionado!` : `❌ ${variant.sprite_name} removido.`;
      await ctx.answerCbQuery(toast, { show_alert: false });

      const caption = uiService.buildVariantCaption(variant);
      const toggleBtn = nowOwned
        ? { text: '❌ Remover da coleção', callback_data: `el_toggle_${variantId}` }
        : { text: '✅ Tenho este sprite!', callback_data: `el_toggle_${variantId}` };

      const keyboard = { inline_keyboard: [ [toggleBtn], [{ text: `⬅️ ${variant.category_name}`, callback_data: `el_cat_${variant.fk_id_category}` }] ] };

      const mediaId = variant.telegram_file_id || variant.file_id;
      if (mediaId) {
        await sendOrEditMedia(ctx, mediaId, caption, keyboard, false);
      } else {
        const imagePath = variant.image ? path.join(IMAGES_BASE, 'elementais', path.basename(variant.image)) : null;
        if (imagePath && fs.existsSync(imagePath)) {
          await sendOrEditMedia(ctx, { source: fs.createReadStream(imagePath) }, caption, keyboard, false);
        } else {
          const isGroup = ctx.chat?.type !== 'private';
          const ephemeralId = ctx.callbackQuery?.message?.ephemeral_message_id;
          
          if (isGroup && ephemeralId) {
            await ctx.telegram.callApi('editEphemeralMessageText', { chat_id: ctx.chat.id, receiver_user_id: userId, ephemeral_message_id: ephemeralId, text: caption, parse_mode: 'HTML', reply_markup: keyboard }).catch(()=>{});
          } else {
            await ctx.editMessageText(caption, { parse_mode: 'HTML', reply_markup: keyboard }).catch(()=>{});
          }
        }
      }
    } catch (error) {
      console.error('[ERROR] el_toggle:', error);
      await sendErrorLog(ctx, 'Erro ao alternar posse da ficha visual', error);
      await ctx.answerCbQuery('❌ Erro ao atualizar coleção.', { show_alert: true });
    }
  });

  bot.action('el_updatemosaic', async (ctx) => {
    try {
      await ctx.answerCbQuery('Processando sua coleção...');
      
      // Apaga o menu efêmero de confirmação/menu anterior
      await deleteEphemeralOrNormal(ctx);
      
      const userIdStr = ctx.from?.id?.toString();
      const userName = ctx.from?.first_name || 'Colecionador';
      
      const mosaicPath = await imageService.generateCollectionMosaic(userIdStr);
      
      if (mosaicPath && fs.existsSync(mosaicPath)) {
        
        // 1. Constrói os dados da legenda idênticos ao comando /colecao
        const [categories, ownedIds] = await Promise.all([
          catalogDb.getElementalCategories(),
          collectionDb.getUserCollectionIds(userIdStr)
        ]);

        const categoryLines = [];
        let totalFiltrado = 0;

        for (const cat of categories) {
          const variants = await catalogDb.getVariantsByCategory(cat.id_elemental_category);
          const owned = variants.filter(v => ownedIds.has(v.id_elemental_variant)).length;
          const total = variants.length;
          const bar = uiService.buildProgressBar(owned, total);

          categoryLines.push(`${uiService.catEmoji(cat.code)} <b>${cat.name}</b>  ${bar}  <i>${owned}/${total}</i>`);
          totalFiltrado += owned;
        }

        const titulo = `📦 <b>Coleção de ${userName}</b>`;
        const textLegenda = `${titulo}\n\n${categoryLines.join('\n')}\n\n<i>Total exibido: ${totalFiltrado} sprite(s).</i>`;
        
        const replyOptions = { parse_mode: 'HTML', caption: textLegenda };
        const stats = fs.statSync(mosaicPath);
        const isDocument = stats.size > 10 * 1024 * 1024;
        
        let sentMsg;
        
        // 2. Envio PÚBLICO da mensagem usando ctx.replyWithPhoto ou ctx.replyWithDocument
        // (Sem o receiver_user_id, a mensagem fica visível para todos)
        if (isDocument) {
          sentMsg = await ctx.replyWithDocument(
            { source: fs.createReadStream(mosaicPath), filename: `colecao_${userIdStr}.jpg` },
            replyOptions
          );
        } else {
          sentMsg = await ctx.replyWithPhoto(
            { source: fs.createReadStream(mosaicPath) },
            replyOptions
          );
        }
        
        // Atualiza a foto mais recente no banco de dados
        if (sentMsg?.photo && socialDb && socialDb.updateUserElementalConfig) {
          const uploadedFileId = sentMsg.photo[sentMsg.photo.length - 1].file_id;
          await socialDb.updateUserElementalConfig(userIdStr, { collection_image_id: uploadedFileId });
        }
        
        fs.unlinkSync(mosaicPath);
      }
    } catch (e) {
      console.error('[ERROR] el_updatemosaic:', e);
      await sendErrorLog(ctx, 'Erro ao atualizar mosaico via botão', e);
    }
  });

  bot.action('el_ignoraremosaic', async (ctx) => {
    try {
      await ctx.answerCbQuery('Sem problemas! Você pode ver a imagem atualizada com /colecao depois.');
      await deleteEphemeralOrNormal(ctx);
    } catch (_) {}
  });

};