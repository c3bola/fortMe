'use strict';

const path = require('path');
const fs = require('fs');

const { ensureUser, ensureBotGroup } = require('../../../utils/databaseUtilsMySQL');
const catalogDb = require('../db/catalogDb');
const socialDb = require('../db/socialDb');
const uiService = require('../services/uiService');
const imageService = require('../services/imageService');
const { sendErrorLog } = require('../../../utils/logger');

const IMAGES_BASE = path.join(__dirname, '../../../../assets/images');

function escapeHTML(text) {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper para deletar a mensagem efêmera corretamente segundo a Bot API 10.2
async function deleteEphemeral(ctx, callerId) {
  const ephemeralId = ctx.callbackQuery?.message?.ephemeral_message_id;
  if (ephemeralId) {
    return ctx.telegram.callApi('deleteEphemeralMessage', {
      chat_id: ctx.chat.id,
      receiver_user_id: parseInt(callerId),
      ephemeral_message_id: ephemeralId
    }).catch(() => {});
  }
  // Fallback caso seja uma mensagem normal perdida
  return ctx.deleteMessage().catch(() => {});
}

module.exports = (bot) => {
  bot.command('ajuda', async (ctx) => {
    console.log('[DEBUG] /ajuda', { chatId: ctx.chat?.id });
    const replyId = ctx.message?.message_id;
    const callerId = ctx.from.id.toString();

    try {
      if (ctx.chat.type === 'private') {
        return ctx.reply('⚠️ O comando /ajuda é exclusivo para grupos!', { reply_to_message_id: replyId });
      }

      const args = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
      
      // Envio de erros/avisos também como efêmeros para não sujar o grupo
      if (!args) {
        return ctx.telegram.sendMessage(ctx.chat.id, 
          '🔍 <b>Buscar Ajudantes</b>\n\n' +
          'Informe o nome do sprite que você precisa de ajuda para encontrar:\n' +
          '<code>/ajuda Duck</code>\n' +
          '<i>Ou pesquise a categoria diretamente:</i>\n' +
          '<code>/ajuda Duck Galáxia</code>',
          { 
            receiver_user_id: parseInt(callerId), 
            parse_mode: 'HTML', 
            reply_to_message_id: replyId 
          }
        );
      }

      await ensureUser(callerId, 1, { first_name: ctx.from.first_name, username: ctx.from.username });
      await ensureBotGroup(ctx.chat.id.toString(), ctx.chat.title || 'Grupo');

      const categories = await catalogDb.getElementalCategories();
      let spriteNameInput = args;
      let targetCategory = null;

      for (const cat of categories) {
        const catCode = cat.code.toLowerCase();
        const catName = cat.name.toLowerCase();
        const regexCode = new RegExp(`\\s+${catCode}$`, 'i');
        const regexName = new RegExp(`\\s+${catName}$`, 'i');

        if (regexCode.test(spriteNameInput)) {
          spriteNameInput = spriteNameInput.replace(regexCode, '').trim();
          targetCategory = cat;
          break;
        } else if (regexName.test(spriteNameInput)) {
          spriteNameInput = spriteNameInput.replace(regexName, '').trim();
          targetCategory = cat;
          break;
        }
      }

      const sprites = await catalogDb.getSpritesByName(spriteNameInput);

      if (sprites.length === 0) {
        return ctx.telegram.sendMessage(ctx.chat.id, 
          `🔍 Nenhum sprite encontrado para "<b>${spriteNameInput}</b>" na temporada atual.\nVerifique o nome e tente novamente.`,
          { receiver_user_id: parseInt(callerId), parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      if (sprites.length > 1) {
        const buttons = sprites.map(s => ([{ text: s.name, callback_data: `el_hlpspr_${s.id_elemental_sprite}_${callerId}` }]));
        return ctx.telegram.sendMessage(ctx.chat.id, 
          `🔍 Encontrei <b>${sprites.length}</b> sprites para "${spriteNameInput}". Escolha um:`, {
          receiver_user_id: parseInt(callerId),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons },
          reply_to_message_id: replyId
        });
      }

      const spriteId = sprites[0].id_elemental_sprite;
      const variants = await catalogDb.getVariantsBySpriteId(spriteId);

      if (variants.length === 0) {
        return ctx.telegram.sendMessage(ctx.chat.id, 
          `⚠️ O sprite <b>${sprites[0].name}</b> ainda não tem variantes ativas.`, 
          { receiver_user_id: parseInt(callerId), parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      if (targetCategory) {
        const variantMatch = variants.find(v => v.fk_id_category === targetCategory.id_elemental_category);
        if (!variantMatch) {
          return ctx.telegram.sendMessage(ctx.chat.id, 
            `⚠️ O sprite <b>${sprites[0].name}</b> não possui a categoria <b>${targetCategory.name}</b>.`, 
            { receiver_user_id: parseInt(callerId), parse_mode: 'HTML', reply_to_message_id: replyId }
          );
        }
        return await sendHelpVerificationPanel(ctx, variantMatch.id_elemental_variant, callerId, false, replyId);
      }

      const basicCategoryObj = categories.find(c => c.code.toLowerCase() === 'basico');
      const defaultVariant = variants.find(v => basicCategoryObj && v.fk_id_category === basicCategoryObj.id_elemental_category) || variants[0];

      return await sendHelpVerificationPanel(ctx, defaultVariant.id_elemental_variant, callerId, false, replyId);

    } catch (error) {
      console.error('[ERROR] /ajuda:', error);
      await sendErrorLog(ctx, 'Falha na execução do comando /ajuda', error);
      // Mensagem de erro também enviada de forma efêmera
      await ctx.telegram.sendMessage(ctx.chat.id, '❌ Erro ao iniciar a busca por ajudantes.', {
        receiver_user_id: parseInt(callerId),
        reply_to_message_id: replyId
      });
    }
  });

  async function sendHelpVerificationPanel(ctx, variantId, callerId, isEdit, replyId) {
    const variant = await catalogDb.getVariantById(variantId);
    if (!variant) return;

    const caption = uiService.buildVariantCaption(variant);
    const protectionSuffix = `_${callerId}`;
    const keyboard = {
      inline_keyboard: [
        [
          { text: '👍 É esse?', callback_data: `el_hlp_yes_${variantId}${protectionSuffix}` },
          { text: '❌ Cancelar', callback_data: `el_hlp_cancel${protectionSuffix}` }
        ]
      ]
    };

    let fileToSend = null;
    const isTelegramFileId = variant.image && !variant.image.includes('.');

    if (variant.telegram_file_id) {
      fileToSend = variant.telegram_file_id;
    } else if (isTelegramFileId) {
      fileToSend = variant.image;
    } else if (variant.image) {
      try {
        const imageBuffer = await imageService.buildIndividualCard(
          variant.sprite_name,
          variant.category_code,
          variant.category_name,
          path.basename(variant.image),
          null,
          true
        );
        fileToSend = { source: Buffer.from(imageBuffer) };
      } catch (err) {
        console.error('[ERROR] Falha ao gerar card em /ajuda:', err.message);
      }
    }

    if (isEdit) {
      // Se for uma edição vinda de um botão, deleta a mensagem efêmera anterior
      await deleteEphemeral(ctx, callerId);
    }

    if (fileToSend) {
      const sentMessage = await ctx.telegram.sendPhoto(ctx.chat.id, fileToSend, {
        receiver_user_id: parseInt(callerId),
        caption: `❓ <i>É este o sprite que você está procurando?</i>\n\n${caption}`,
        parse_mode: 'HTML',
        reply_markup: keyboard,
        ...(replyId && { reply_to_message_id: replyId })
      });

      if (fileToSend.source && !variant.telegram_file_id && !isTelegramFileId) {
        const bestQualityPhoto = sentMessage.photo[sentMessage.photo.length - 1];
        await catalogDb.updateVariantImage(variant.id_elemental_variant, bestQualityPhoto.file_id);
      }
      return sentMessage;
    } else {
      const textCaption = `❓ <i>É este o sprite que você está procurando?</i>\n\n${caption}`;
      return ctx.telegram.sendMessage(ctx.chat.id, textCaption, {
        receiver_user_id: parseInt(callerId),
        parse_mode: 'HTML',
        reply_markup: keyboard,
        ...(replyId && { reply_to_message_id: replyId })
      });
    }
  }

  function isCaller(queryData, callerId) {
    const parts = queryData.split('_');
    const idFromCallback = parts[parts.length - 1];
    return idFromCallback === callerId;
  }

  bot.action(/^el_hlpspr_(\d+)_(\d+)$/, async (ctx) => {
    const spriteId = parseInt(ctx.match[1]);
    const callerId = ctx.match[2];

    if (!isCaller(ctx.callbackQuery.data, callerId)) {
      return ctx.answerCbQuery('⚠️ Apenas quem pediu ajuda pode escolher a opção!', { show_alert: true });
    }

    const originalReplyId = ctx.callbackQuery.message?.reply_to_message?.message_id;

    try {
      await ctx.answerCbQuery();
      const variants = await catalogDb.getVariantsBySpriteId(spriteId);
      
      if (variants.length === 0) {
        await deleteEphemeral(ctx, callerId);
        return ctx.telegram.sendMessage(ctx.chat.id, '⚠️ Nenhuma variante ativa encontrada.', {
          receiver_user_id: parseInt(callerId),
          parse_mode: 'HTML'
        });
      }

      if (variants.length === 1) {
        return await sendHelpVerificationPanel(ctx, variants[0].id_elemental_variant, callerId, true, originalReplyId);
      }

      const categories = await catalogDb.getElementalCategories();
      const catMap = Object.fromEntries(categories.map(c => [c.id_elemental_category, c]));

      const buttons = variants.map(v => {
        const cat = catMap[v.fk_id_category];
        const emoji = cat ? uiService.catEmoji(cat.code) : '🔹';
        const label = cat ? cat.name : 'Variante';
        return [{ text: `${emoji} ${label}`, callback_data: `el_hlpvar_${v.id_elemental_variant}_${callerId}` }];
      });

      await deleteEphemeral(ctx, callerId);
      await ctx.telegram.sendMessage(ctx.chat.id, `🔍 Escolha a categoria do <b>${variants[0].sprite_name}</b> que você procura:`, {
        receiver_user_id: parseInt(callerId),
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      });
    } catch (error) {
      console.error('[ERROR] el_hlpspr:', error);
      await sendErrorLog(ctx, 'Falha ao escolher sprite em /ajuda', error);
    }
  });

  bot.action(/^el_hlpvar_(\d+)_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const callerId = ctx.match[2];

    if (!isCaller(ctx.callbackQuery.data, callerId)) {
      return ctx.answerCbQuery('⚠️ Apenas quem pediu ajuda pode escolher a opção!', { show_alert: true });
    }

    try {
      await ctx.answerCbQuery('Carregando ficha...');
      const originalReplyId = ctx.callbackQuery.message?.reply_to_message?.message_id;
      await sendHelpVerificationPanel(ctx, variantId, callerId, true, originalReplyId);
    } catch (error) {
      console.error('[ERROR] el_hlpvar:', error);
      await sendErrorLog(ctx, 'Falha ao carregar ficha de variante em /ajuda', error);
    }
  });

  bot.action(/^el_hlp_yes_(\d+)_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const callerId = ctx.match[2];

    if (!isCaller(ctx.callbackQuery.data, callerId)) {
      return ctx.answerCbQuery('⚠️ Este botão não é para você!', { show_alert: true });
    }

    const originalReplyId = ctx.callbackQuery.message?.reply_to_message?.message_id;

    try {
      await ctx.answerCbQuery('Listando guardiões...');
      
      // Apaga a mensagem EFÊMERA de verificação instantaneamente
      await deleteEphemeral(ctx, callerId);
      
      // Envia a lista de forma PÚBLICA e NORMAL para todos verem
      await showHelpersAndLog(ctx, variantId, originalReplyId);
    } catch (error) {
      console.error('[ERROR] el_hlp_yes:', error);
      await sendErrorLog(ctx, 'Falha ao confirmar busca e listar ajudantes', error);
      
      // Mensagem de erro também efêmera
      await ctx.telegram.sendMessage(ctx.chat.id, `❌ Ocorreu um erro interno ao buscar ajudantes. O problema foi registrado.`, { 
        receiver_user_id: parseInt(callerId),
        reply_to_message_id: originalReplyId 
      }).catch(() => { });
    }
  });

  bot.action(/^el_hlp_cancel_(\d+)$/, async (ctx) => {
    const callerId = ctx.match[1];
    if (!isCaller(ctx.callbackQuery.data, callerId)) {
      return ctx.answerCbQuery('⚠️ Este botão não é para você!', { show_alert: true });
    }
    try {
      await ctx.answerCbQuery('Busca cancelada.');
      // O usuário clicou em cancelar. Apenas apagamos a mensagem efêmera.
      await deleteEphemeral(ctx, callerId);
    } catch (_) { }
  });

  async function showHelpersAndLog(ctx, variantId, replyId) {
    let [variant, helpers] = await Promise.all([
      catalogDb.getVariantById(variantId),
      socialDb.getHelpersForVariant(variantId, 100)
    ]);

    if (!variant) return;

    helpers = shuffleArray(helpers).slice(0, 15);
    const emoji = uiService.catEmoji(variant.category_code);
    const safeSpriteName = escapeHTML(variant.sprite_name);
    const safeCategoryName = escapeHTML(variant.category_name);

    let text = `🆘 <b>Buscando Ajuda</b>\n\n`;
    text += `Sprite procurado: ${emoji} <b>${safeSpriteName}</b> (<i>${safeCategoryName}</i>)\n\n`;

    if (helpers.length === 0) {
      text += `Nenhum colecionador possui este sprite com pedidos de ajuda ativos. 😔`;
    } else {
      text += `Estes colecionadores possuem o sprite e aceitam pedidos de ajuda:\n\n`;
      helpers.forEach(h => {
        const rawName = h.first_name || 'Colecionador';
        const name = escapeHTML(rawName);
        let mention = name;

        if (h.allow_group_mention) {
          mention = h.username ? `@${h.username}` : `<a href="tg://user?id=${h.user_id}">${name}</a>`;
        } else {
          mention = `<b>${name}</b>`;
        }
        text += `• ${mention}\n`;
      });
      text += `\n<b>A lista de players acima serve exclusivamente para indicar quem tem o elemental.</b>\n<blockquote>⚠️ <b>Aviso importante:</b> <b>Não chame os membros no privado</b> para solicitar um elemental, salvo os casos em que o membro autorize expressamente aqui no grupo. Vamos manter o respeito ao privado de cada jogador!</blockquote>\n\n<i>Responda uma mensagem de quem te ajudar com <code>/agradecer</code> para registrar o ato!</i>`;
    }

    let sentMsg;
    try {
      // Esta é a única mensagem que vai SEM receiver_user_id, logo é PÚBLICA
      sentMsg = await ctx.reply(text, {
        parse_mode: 'HTML',
        ...(replyId && { reply_to_message_id: replyId })
      });
    } catch (replyError) {
      sentMsg = await ctx.reply(text, { parse_mode: 'HTML' });
    }

    try {
      const configModule = require('../../../config/config');
      if (configModule.logGroup?.status && configModule.logGroup?.id) {
        const logText =
          `🌐 <b>Log de Ajuda:</b> Alguém confirmou busca de ajuda no grupo!\n` +
          `${emoji} ${safeSpriteName} (${safeCategoryName})\n` +
          `👤 <b>Usuário:</b> ${escapeHTML(ctx.from?.first_name) || 'User'}`;

        await bot.telegram.sendMessage(configModule.logGroup.id, logText, {
          parse_mode: 'HTML',
          message_thread_id: configModule.logGroup.topic || undefined
        });
      }
    } catch (logErr) {
      console.error('[LOG ERROR] Falha ao registrar log de ajuda:', logErr.message);
    }

    return sentMsg;
  }
};