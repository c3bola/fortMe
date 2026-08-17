'use strict';

const path = require('path');
const fs = require('fs');

const { query } = require('../../database/dbConnection');

const {
  ensureUser,
  ensureBotGroup,
  getVariantById,
  updateUserElementalConfig,
  toggleVariantInCollection,
  hasVariantInCollection,
  toggleVariantDomination
} = require('../../utils/databaseUtilsMySQL');

const {
  IMAGES_BASE,
  buildVariantCaption,
  generateCollectionMosaic,
  sendCategoryMenu,
  sendSpriteList
} = require('./elementalCommon');

module.exports = (bot) => {

  // ─── Botão Global: Fechar Menus ──────────────────────────────────────────────
  bot.action('el_close', async (ctx) => {
    try {
      await ctx.deleteMessage();
    } catch (e) {
      // Ignora erro silenciosamente se a mensagem já tiver sido apagada
    }
  });

  // ─── Comandos /elementais e /sprites (INTERCEPTADOR DE MODOS) ────────────────

  async function handleCatalogCommand(ctx) {
    console.log('[DEBUG] Elementais/Sprites iniciado', { userId: ctx.from?.id, chatId: ctx.chat?.id });
    try {
      if (ctx.chat.type !== 'private') {
        const fortniteMessage = 
          '🪂 <b>Atenção, Explorador!</b>\n\n' +
          'O catálogo de Elementais consome muito escudo para ser aberto no meio do esquadrão. ' +
          'Me chame no privado (PV) para acessar e gerenciar sua coleção com segurança! 🛡️';
          
        return ctx.reply(fortniteMessage, { 
          parse_mode: 'HTML',
          reply_to_message_id: ctx.message.message_id 
        });
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

      await ctx.reply('<b>Como você quer explorar seus Elementais?</b>', { 
        parse_mode: 'HTML',
        reply_markup: keyboard,
        reply_to_message_id: ctx.message.message_id
      });
      
    } catch (error) {
      console.error('[ERROR] Elementais comando:', error.message);
      await ctx.reply('❌ Erro ao carregar o catálogo. Tente novamente.', {
        reply_to_message_id: ctx.message?.message_id 
      });
    }
  }

  bot.command('elementais', handleCatalogCommand);
  bot.command('sprites', handleCatalogCommand);

  // ─── Navegação de Modos (Lista vs Galeria) ───────────────────────────────────

  // Modo Original (Lista)
  bot.action('el_mode_list', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await sendCategoryMenu(ctx, true);
    } catch (e) {
      console.error(e);
    }
  });

  // Volta para a seleção de modos
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
      
      const isPhoto = !!(ctx.callbackQuery?.message?.photo);
      if (isPhoto) {
        await ctx.deleteMessage().catch(() => {});
        await ctx.reply('<b>Como você quer explorar seus Elementais?</b>', { parse_mode: 'HTML', reply_markup: keyboard });
      } else {
        await ctx.editMessageText('<b>Como você quer explorar seus Elementais?</b>', { parse_mode: 'HTML', reply_markup: keyboard });
      }
    } catch (e) {
      console.error(e);
    }
  });

  // Modo Novo (Menu de Categorias da Galeria)
  bot.action('el_mode_gal', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const categories = await query('SELECT * FROM tb_elemental_category WHERE is_active = 1 ORDER BY display_order');
      
      const keyboard = { inline_keyboard: [] };
      for (let i = 0; i < categories.length; i += 2) {
        const row = [];
        row.push({ text: categories[i].name, callback_data: `el_galcat_${categories[i].id_elemental_category}` });
        if (categories[i+1]) {
          row.push({ text: categories[i+1].name, callback_data: `el_galcat_${categories[i+1].id_elemental_category}` });
        }
        keyboard.inline_keyboard.push(row);
      }
      keyboard.inline_keyboard.push([
        { text: '🔙 Voltar aos Modos', callback_data: 'el_mode_select' },
        { text: '🗑️ Fechar', callback_data: 'el_close' }
      ]);

      const txt = '🖼️ <b>Modo Galeria:</b>\nEscolha uma categoria para visualizar as cartas em detalhes.';
      const isPhoto = !!(ctx.callbackQuery?.message?.photo);
      
      if (isPhoto) {
        await ctx.deleteMessage().catch(() => {});
        await ctx.reply(txt, { parse_mode: 'HTML', reply_markup: keyboard });
      } else {
        await ctx.editMessageText(txt, { parse_mode: 'HTML', reply_markup: keyboard });
      }
    } catch (error) {
      console.error('[ERROR] el_mode_gal:', error.message);
      await ctx.answerCbQuery('❌ Erro.', { show_alert: true });
    }
  });

  // ─── Lógica da Galeria Visual (Paginação e Renderização) ─────────────────────

  async function renderGalleryFrame(ctx, categoryId, index, userId, isNewMessage) {
    try {
      const sql = `
        SELECT v.*, s.name as sprite_name, s.description as sprite_description, c.name as category_name, c.code as category_code
        FROM tb_elemental_variant v
        JOIN tb_elemental_sprite s ON v.fk_id_sprite = s.id_elemental_sprite
        JOIN tb_elemental_category c ON v.fk_id_category = c.id_elemental_category
        WHERE v.fk_id_category = ? AND v.is_active = 1 AND s.is_active = 1
        ORDER BY s.display_order, v.id_elemental_variant
      `;
      const variants = await query(sql, [categoryId]);

      if (variants.length === 0) {
        return ctx.answerCbQuery('❌ Categoria vazia.', { show_alert: true });
      }

      // Limites de navegação
      if (index < 0) index = 0;
      if (index >= variants.length) index = variants.length - 1;

      const variant = variants[index];
      
      // Busca a posse e dominação da carta no banco de dados
      const collInfo = await query('SELECT is_dominated FROM tb_elemental_collection WHERE fk_id_user = ? AND fk_id_variant = ?', [userId, variant.id_elemental_variant]);
      const owned = collInfo.length > 0;
      const isDominated = owned && collInfo[0].is_dominated === 1;

      // Índices para os botões de navegação
      const maxIdx = variants.length - 1;
      const prevIdx = index > 0 ? index - 1 : 0;
      const nextIdx = index < maxIdx ? index + 1 : maxIdx;

      // Array com as setinhas e contagem
      const navRow = [
        { text: '⏮️', callback_data: index === 0 ? 'noop' : `el_gal_${categoryId}_0` },
        { text: '◀️', callback_data: index === 0 ? 'noop' : `el_gal_${categoryId}_${prevIdx}` },
        { text: `${index + 1} / ${variants.length}`, callback_data: 'noop' },
        { text: '▶️', callback_data: index === maxIdx ? 'noop' : `el_gal_${categoryId}_${nextIdx}` },
        { text: '⏭️', callback_data: index === maxIdx ? 'noop' : `el_gal_${categoryId}_${maxIdx}` }
      ];

      // Botão de Obter / Remover Posse
      const toggleBtn = owned
        ? { text: '❌ Remover', callback_data: `el_galtog_${categoryId}_${index}_${variant.id_elemental_variant}` }
        : { text: '✅ Marcar Obtido', callback_data: `el_galtog_${categoryId}_${index}_${variant.id_elemental_variant}` };

      // Botão de Dominar SEMPRE visível (apenas muda o texto e o callback exibe erro se o usuário não possuir a carta)
      const domBtn = isDominated
        ? { text: '⬛ Remover Dominação', callback_data: `el_galdom_${categoryId}_${index}_${variant.id_elemental_variant}` }
        : { text: '👑 Dominar', callback_data: `el_galdom_${categoryId}_${index}_${variant.id_elemental_variant}` };

      const keyboard = {
        inline_keyboard: [
          navRow,
          [toggleBtn, domBtn], // Ambos na mesma linha para UI equilibrada
          [
            { text: '⬅️ Voltar', callback_data: 'el_mode_gal' },
            { text: '🗑️ Fechar', callback_data: 'el_close' }
          ]
        ]
      };

      const caption = buildVariantCaption(variant);
      const mediaId = variant.telegram_file_id || variant.file_id; 

      if (isNewMessage) {
        await ctx.deleteMessage().catch(() => {});
        if (mediaId) {
          await ctx.replyWithPhoto(mediaId, { caption, parse_mode: 'HTML', reply_markup: keyboard });
        } else {
          const imagePath = variant.image ? path.join(IMAGES_BASE, variant.image) : null;
          if (imagePath && fs.existsSync(imagePath)) {
             await ctx.replyWithPhoto({ source: fs.createReadStream(imagePath) }, { caption, parse_mode: 'HTML', reply_markup: keyboard });
          } else {
             await ctx.reply(caption + '\n\n⚠️ <i>Imagem indisponível.</i>', { parse_mode: 'HTML', reply_markup: keyboard });
          }
        }
      } else {
        if (mediaId) {
          await ctx.editMessageMedia(
            { type: 'photo', media: mediaId, caption: caption, parse_mode: 'HTML' },
            { reply_markup: keyboard }
          ).catch(e => { /* Ignora erro se a imagem enviada for idêntica à atual */ });
        } else {
          const imagePath = variant.image ? path.join(IMAGES_BASE, variant.image) : null;
          if (imagePath && fs.existsSync(imagePath)) {
            await ctx.editMessageMedia(
              { type: 'photo', media: { source: fs.createReadStream(imagePath) }, caption: caption, parse_mode: 'HTML' },
              { reply_markup: keyboard }
            ).catch(e => {});
          }
        }
      }
    } catch (e) {
      console.error('[ERROR] renderGalleryFrame:', e);
      await ctx.answerCbQuery('Erro ao carregar a galeria.', { show_alert: true });
    }
  }

  // Ignora toques em botões vazios da navegação
  bot.action('noop', async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
  });

  // Entrar na Galeria de uma Categoria Específica
  bot.action(/^el_galcat_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id?.toString();
    await ctx.answerCbQuery('Carregando galeria...');
    await renderGalleryFrame(ctx, categoryId, 0, userId, true);
  });

  // Navegar entre as fotos da galeria (Setinhas)
  bot.action(/^el_gal_(\d+)_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const index = parseInt(ctx.match[2]);
    const userId = ctx.from?.id?.toString();
    await ctx.answerCbQuery();
    await renderGalleryFrame(ctx, categoryId, index, userId, false);
  });

  // Botão "Tenho / Remover" direto de dentro da Galeria
  bot.action(/^el_galtog_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const index = parseInt(ctx.match[2]);
    const variantId = parseInt(ctx.match[3]);
    const userId = ctx.from?.id?.toString();

    try {
      const nowOwned = await toggleVariantInCollection(userId, variantId);
      await updateUserElementalConfig(userId, { collection_image_id: null }); // Invalida mosaico
      
      const toast = nowOwned ? '✅ Adicionado à coleção!' : '❌ Removido da coleção.';
      await ctx.answerCbQuery(toast, { show_alert: false });

      // Atualiza os botões instantaneamente sem trocar de imagem
      await renderGalleryFrame(ctx, categoryId, index, userId, false);

      await ctx.reply(
        '🔄 <b>Sua coleção mudou!</b>\nDeseja gerar a nova imagem da sua coleção com as atualizações?',
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Sim, gerar mosaico', callback_data: `el_updatemosaic` },
                { text: '❌ Deixar para depois', callback_data: `el_ignoraremosaic` }
              ]
            ]
          }
        }
      );

    } catch (e) {
      console.error('[ERROR] el_galtog:', e);
      await ctx.answerCbQuery('Erro ao atualizar coleção.', { show_alert: true });
    }
  });

  // Botão "Dominar" direto de dentro da Galeria
  bot.action(/^el_galdom_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const index = parseInt(ctx.match[2]);
    const variantId = parseInt(ctx.match[3]);
    const userId = ctx.from?.id?.toString();

    try {
      const isNowDominated = await toggleVariantDomination(userId, variantId);
      const toast = isNowDominated ? '👑 Sprite dominado com sucesso!' : '⬛ Marcação de dominação removida.';
      await ctx.answerCbQuery(toast, { show_alert: false });

      // Atualiza o botão da galeria em tempo real
      await renderGalleryFrame(ctx, categoryId, index, userId, false);
    } catch (error) {
      console.error('[ERROR] el_galdom:', error.message);
      if (error.message === 'NOT_IN_COLLECTION') {
        await ctx.answerCbQuery('❌ Você precisa ter o sprite na coleção para dominá-lo!', { show_alert: true });
      } else {
        await ctx.answerCbQuery('❌ Erro técnico ao processar dominação.', { show_alert: true });
      }
    }
  });


  // ─── Manutenção do Fluxo Antigo (Modo Lista em Texto) ────────────────────────

  bot.action(/^el_cat_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id?.toString();
    try {
      await ctx.answerCbQuery();
      const isPhoto = !!(ctx.callbackQuery?.message?.photo);
      if (isPhoto) {
        try { await ctx.deleteMessage(); } catch (_) { }
        await sendSpriteList(ctx, categoryId, false, userId);
      } else {
        await sendSpriteList(ctx, categoryId, true, userId);
      }
    } catch (error) {
      console.error('[ERROR] el_cat:', error.message);
      await ctx.answerCbQuery('❌ Erro ao carregar sprites.', { show_alert: true });
    }
  });

  bot.action(/^el_chk_(\d+)_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const categoryId = parseInt(ctx.match[2]);
    const userId = ctx.from?.id?.toString();

    try {
      const nowOwned = await toggleVariantInCollection(userId, variantId);
      await updateUserElementalConfig(userId, { collection_image_id: null });
      const toast = nowOwned ? '✅ Adicionado à coleção!' : '❌ Removido da coleção.';
      await ctx.answerCbQuery(toast, { show_alert: false });
      await sendSpriteList(ctx, categoryId, true, userId);
    } catch (error) {
      console.error('[ERROR] el_chk:', error.message);
      await ctx.answerCbQuery('❌ Erro ao atualizar coleção.', { show_alert: true });
    }
  });

  bot.action(/^el_dom_(\d+)_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const categoryId = parseInt(ctx.match[2]);
    const userId = ctx.from?.id?.toString();

    try {
      const isNowDominated = await toggleVariantDomination(userId, variantId);
      const toast = isNowDominated ? '👑 Sprite dominado com sucesso!' : '⬛ Marcação de dominação removida.';
      await ctx.answerCbQuery(toast, { show_alert: false });
      await sendSpriteList(ctx, categoryId, true, userId);
    } catch (error) {
      console.error('[ERROR] el_dom:', error.message);
      if (error.message === 'NOT_IN_COLLECTION') {
        await ctx.answerCbQuery('❌ Você precisa ter o sprite na coleção para dominá-lo!', { show_alert: true });
      } else {
        await ctx.answerCbQuery('❌ Erro técnico ao processar dominação.', { show_alert: true });
      }
    }
  });

  bot.action(/^el_back_cat$/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await sendCategoryMenu(ctx, true);
    } catch (error) {
      console.error('[ERROR] el_back_cat:', error.message);
      await ctx.answerCbQuery('❌ Erro.', { show_alert: true });
    }
  });

  bot.action(/^el_var_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id?.toString();
    try {
      await ctx.answerCbQuery();

      const [variant, owned] = await Promise.all([
        getVariantById(variantId),
        hasVariantInCollection(userId, variantId),
      ]);

      if (!variant) return ctx.answerCbQuery('❌ Sprite não encontrado.', { show_alert: true });

      const caption = buildVariantCaption(variant);
      const toggleBtn = owned
        ? { text: '❌ Remover da coleção', callback_data: `el_toggle_${variantId}` }
        : { text: '✅ Tenho este sprite!', callback_data: `el_toggle_${variantId}` };

      const keyboard = { inline_keyboard: [ [toggleBtn], [{ text: `⬅️ ${variant.category_name}`, callback_data: `el_cat_${variant.fk_id_category}` }] ] };
      
      const mediaId = variant.telegram_file_id || variant.file_id;
      if (mediaId) {
        try { await ctx.deleteMessage(); } catch (_) { }
        await ctx.replyWithPhoto(mediaId, { caption, parse_mode: 'HTML', reply_markup: keyboard });
      } else {
        const imagePath = variant.image ? path.join(IMAGES_BASE, variant.image) : null;
        if (imagePath && fs.existsSync(imagePath)) {
          try { await ctx.deleteMessage(); } catch (_) { }
          await ctx.replyWithPhoto({ source: fs.createReadStream(imagePath) }, { caption, parse_mode: 'HTML', reply_markup: keyboard });
        } else {
          const textCaption = variant.image ? `${caption}\n\n⚠️ <i>Imagem não disponível.</i>` : caption;
          await ctx.editMessageText(textCaption, { parse_mode: 'HTML', reply_markup: keyboard });
        }
      }
    } catch (error) {
      console.error('[ERROR] el_var:', error.message);
      await ctx.answerCbQuery('❌ Erro ao carregar ficha.', { show_alert: true });
    }
  });

  bot.action(/^el_toggle_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id?.toString();
    try {
      const variant = await getVariantById(variantId);
      if (!variant) return ctx.answerCbQuery('❌ Sprite não encontrado.', { show_alert: true });

      const nowOwned = await toggleVariantInCollection(userId, variantId);
      await updateUserElementalConfig(userId, { collection_image_id: null });

      await ctx.reply(
        '🔄 <b>Sua coleção foi atualizada!</b>\nDeseja gerar a nova imagem da sua coleção agora?',
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Sim, gerar agora', callback_data: `el_updatemosaic` },
                { text: '❌ Deixar para depois', callback_data: `el_ignoraremosaic` }
              ]
            ]
          }
        }
      );

      const toast = nowOwned ? `✅ ${variant.sprite_name} adicionado!` : `❌ ${variant.sprite_name} removido.`;
      await ctx.answerCbQuery(toast, { show_alert: false });

      const caption = buildVariantCaption(variant);
      const toggleBtn = nowOwned
        ? { text: '❌ Remover da coleção', callback_data: `el_toggle_${variantId}` }
        : { text: '✅ Tenho este sprite!', callback_data: `el_toggle_${variantId}` };

      const keyboard = { inline_keyboard: [ [toggleBtn], [{ text: `⬅️ ${variant.category_name}`, callback_data: `el_cat_${variant.fk_id_category}` }] ] };

      const isPhoto = !!(ctx.callbackQuery?.message?.photo);
      if (isPhoto) {
        await ctx.editMessageCaption(caption, { parse_mode: 'HTML', reply_markup: keyboard });
      } else {
        await ctx.editMessageText(caption, { parse_mode: 'HTML', reply_markup: keyboard });
      }
    } catch (error) {
      console.error('[ERROR] el_toggle:', error.message);
      await ctx.answerCbQuery('❌ Erro ao atualizar coleção.', { show_alert: true });
    }
  });

  // ─── Atualização do Mosaico ──────────────────────────────────────────────────

  bot.action('el_updatemosaic', async (ctx) => {
    try {
      await ctx.answerCbQuery('Gerando mosaico...');
      await ctx.deleteMessage().catch(() => {});
      
      const userId = ctx.from?.id?.toString();
      const mosaicPath = await generateCollectionMosaic(userId);
      
      if (fs.existsSync(mosaicPath)) {
        const sentMsg = await ctx.replyWithPhoto(
          { source: fs.createReadStream(mosaicPath) }, 
          { caption: '📦 <b>Sua Coleção Atualizada</b>', parse_mode: 'HTML' }
        );
        
        if (sentMsg?.photo) {
          const uploadedFileId = sentMsg.photo[sentMsg.photo.length - 1].file_id;
          await updateUserElementalConfig(userId, { collection_image_id: uploadedFileId });
        }
        fs.unlinkSync(mosaicPath);
      }
    } catch (e) {
      console.error('[ERROR] el_updatemosaic:', e.message);
    }
  });

  bot.action('el_ignoraremosaic', async (ctx) => {
    try {
      await ctx.answerCbQuery('Sem problemas! Você pode ver a imagem atualizada com /colecao depois.');
      await ctx.deleteMessage().catch(() => {});
    } catch (_) {}
  });

};