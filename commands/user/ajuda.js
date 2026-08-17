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
  getHelpersForVariant,
  updateVariantFileId
} = require('../../utils/databaseUtilsMySQL');

const {
  IMAGES_BASE,
  catEmoji,
  buildVariantCaption
} = require('./elementalCommon');

/**
 * Função para escapar caracteres HTML do nome dos usuários
 */
function escapeHTML(text) {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Função auxiliar para embaralhar um array aleatoriamente (Fisher-Yates)
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = (bot) => {
  // ─── Comando: /ajuda ─────────────────────────────────────────────────────────

  bot.command('ajuda', async (ctx) => {
    console.log('[DEBUG] /ajuda', { chatId: ctx.chat?.id });
    
    // Captura o ID da mensagem do usuário para o bot responder a ela
    const replyId = ctx.message?.message_id;

    try {
      if (ctx.chat.type === 'private') {
        return ctx.reply('⚠️ O comando /ajuda é exclusivo para grupos!', { reply_to_message_id: replyId });
      }

      const args = ctx.message?.text?.split(/\s+/).slice(1).join(' ').trim();
      if (!args) {
        return ctx.reply(
          '🔍 <b>Buscar Ajudantes</b>\n\n' +
          'Informe o nome do sprite que você precisa de ajuda para encontrar:\n' +
          '<code>/ajuda Duck</code>\n' +
          '<i>Ou pesquise a categoria diretamente:</i>\n' +
          '<code>/ajuda Duck Galáxia</code>',
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }
      
      const callerId = ctx.from.id.toString();
      await ensureUser(callerId, 1, { first_name: ctx.from.first_name, username: ctx.from.username });
      await ensureBotGroup(ctx.chat.id.toString(), ctx.chat.title || 'Grupo');

      // 1. Carregamos as categorias PRIMEIRO para fazer um match inteligente da string
      const categories = await getElementalCategories();
      
      let spriteNameInput = args;
      let targetCategory = null;

      // 2. Buscamos de trás para frente se o usuário digitou uma categoria no final do nome
      // Mudança crítica: Garante que a remoção ocorra apenas se o termo estiver rigorosamente no final da string ($)
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

      const sprites = await getSpritesByName(spriteNameInput);

      if (sprites.length === 0) {
        return ctx.reply(
          `🔍 Nenhum sprite encontrado para "<b>${spriteNameInput}</b>".\nVerifique o nome e tente novamente.`,
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      // Se achou mais de um sprite, pede para o usuário escolher o personagem base
      if (sprites.length > 1) {
        const buttons = sprites.map(s => ([{ text: s.name, callback_data: `el_hlpspr_${s.id_elemental_sprite}_${callerId}` }]));
        return ctx.reply(`🔍 Encontrei <b>${sprites.length}</b> sprites para "${spriteNameInput}". Escolha um:`, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons },
          reply_to_message_id: replyId
        });
      }

      const spriteId = sprites[0].id_elemental_sprite;
      const variants = await getVariantsBySpriteId(spriteId);
      
      if (variants.length === 0) {
        return ctx.reply(`⚠️ O sprite <b>${sprites[0].name}</b> ainda não tem variantes ativas.`, { parse_mode: 'HTML', reply_to_message_id: replyId });
      }

      // 3. Se o usuário informou a categoria no comando (ex: ponto zero metalizado)
      if (targetCategory) {
        const variantMatch = variants.find(v => v.fk_id_category === targetCategory.id_elemental_category);
        if (!variantMatch) {
          return ctx.reply(`⚠️ O sprite <b>${sprites[0].name}</b> não possui a categoria <b>${targetCategory.name}</b>.`, { parse_mode: 'HTML', reply_to_message_id: replyId });
        }

        // Dispara o painel visual da variante exata
        return await sendHelpVerificationPanel(ctx, variantMatch.id_elemental_variant, callerId, false, replyId);
      }

      // Descobre dinamicamente o ID da categoria correspondente ao código 'basico' trazido do banco
      const basicCategoryObj = categories.find(c => c.code.toLowerCase() === 'basico');
      
      // Busca a variante correspondente ao ID da categoria 'Básico' obtido dinamicamente. Fallback para a primeira do array caso não ache.
      const defaultVariant = variants.find(v => basicCategoryObj && v.fk_id_category === basicCategoryObj.id_elemental_category) || variants[0];

      return await sendHelpVerificationPanel(ctx, defaultVariant.id_elemental_variant, callerId, false, replyId);

    } catch (error) {
      console.error('[ERROR] /ajuda:', error.message);
      await ctx.reply('❌ Erro ao iniciar a busca por ajudantes.', { reply_to_message_id: replyId });
    }
  });

  // ─── Função Auxiliar: Apresenta Painel Visual de Validação ────────────────────

  async function sendHelpVerificationPanel(ctx, variantId, callerId, isEdit, replyId) {
    const variant = await getVariantById(variantId);
    if (!variant) return;

    const caption = buildVariantCaption(variant);
    const protectionSuffix = `_${callerId}`;
    const keyboard = {
      inline_keyboard: [
        [
          { text: '👍 É esse?', callback_data: `el_hlp_yes_${variantId}${protectionSuffix}` },
          { text: '❌ Cancelar', callback_data: `el_hlp_cancel${protectionSuffix}` }
        ]
      ]
    };

    // Lógica do Cache (Telegram ID > Disco)
    let fileToSend = null;
    if (variant.telegram_file_id) {
      fileToSend = variant.telegram_file_id;
    } else if (variant.image) {
      const imagePath = path.join(IMAGES_BASE, variant.image);
      if (fs.existsSync(imagePath)) {
        fileToSend = { source: fs.createReadStream(imagePath) };
      }
    }

    if (fileToSend) {
      if (isEdit) { try { await ctx.deleteMessage(); } catch (_) {} }
      
      const sentMessage = await ctx.replyWithPhoto(fileToSend, { 
        caption: `❓ <i>É este o sprite que você está procurando?</i>\n\n${caption}`, 
        parse_mode: 'HTML', 
        reply_markup: keyboard,
        ...(replyId && { reply_to_message_id: replyId }) // Responde se tiver o ID
      });

      // Salva no cache se foi lido do disco!
      if (fileToSend.source && !variant.telegram_file_id) {
        const bestQualityPhoto = sentMessage.photo[sentMessage.photo.length - 1];
        updateVariantFileId(variant.id_elemental_variant, bestQualityPhoto.file_id);
      }

      return sentMessage;
    } else {
      // Fallback para texto sem imagem
      const textCaption = `❓ <i>É este o sprite que você está procurando?</i>\n\n${caption}`;
      if (isEdit) {
        return ctx.editMessageText(textCaption, { parse_mode: 'HTML', reply_markup: keyboard });
      }
      return ctx.reply(textCaption, { 
        parse_mode: 'HTML', 
        reply_markup: keyboard,
        ...(replyId && { reply_to_message_id: replyId }) 
      });
    }
  }

  // ─── Callbacks Protegidos de Interação do Comando /ajuda ──────────────────────

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

    // Identifica o ID da mensagem original para manter a resposta ativa
    const originalReplyId = ctx.callbackQuery.message?.reply_to_message?.message_id;

    try {
      await ctx.answerCbQuery();
      const variants = await getVariantsBySpriteId(spriteId);
      if (variants.length === 0) {
        return ctx.editMessageText('⚠️ Nenhuma variante activa encontrada.', { parse_mode: 'HTML' });
      }

      if (variants.length === 1) {
        return await sendHelpVerificationPanel(ctx, variants[0].id_elemental_variant, callerId, true, originalReplyId);
      }

      const categories = await getElementalCategories();
      const catMap = Object.fromEntries(categories.map(c => [c.id_elemental_category, c]));

      const buttons = variants.map(v => {
        const cat = catMap[v.fk_id_category];
        const emoji = cat ? catEmoji(cat.code) : '🔹';
        const label = cat ? cat.name : 'Variante';
        return [{ text: `${emoji} ${label}`, callback_data: `el_hlpvar_${v.id_elemental_variant}_${callerId}` }];
      });

      await ctx.editMessageText(`🔍 Escolha a categoria do <b>${variants[0].sprite_name}</b> que você procura:`, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      });
    } catch (error) {
      console.error('[ERROR] el_hlpspr:', error.message);
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
      console.error('[ERROR] el_hlpvar:', error.message);
    }
  });

  // ─── Confirmação de Ajudantes ("É esse?") ────────────────────────────────────

  bot.action(/^el_hlp_yes_(\d+)_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const callerId = ctx.match[2];

    if (!isCaller(ctx.callbackQuery.data, callerId)) {
      return ctx.answerCbQuery('⚠️ Este botão não é para você!', { show_alert: true });
    }

    // Identifica o ID da mensagem original para manter a resposta ativa
    const originalReplyId = ctx.callbackQuery.message?.reply_to_message?.message_id;

    try {
      await ctx.answerCbQuery('Listando guardiões...');
      
      try { await ctx.deleteMessage(); } catch (_) {}
      
      await showHelpersAndLog(ctx, variantId, originalReplyId);
      
    } catch (error) {
      console.error('[ERROR] el_hlp_yes:', error.message);
      await ctx.reply(`❌ <b>Erro interno ao buscar ajudantes:</b> ${error.message}`, { parse_mode: 'HTML', reply_to_message_id: originalReplyId }).catch(() => {});
    }
  });

  bot.action(/^el_hlp_cancel_(\d+)$/, async (ctx) => {
    const callerId = ctx.match[1];
    if (!isCaller(ctx.callbackQuery.data, callerId)) {
      return ctx.answerCbQuery('⚠️ Este botão não é para você!', { show_alert: true });
    }
    try {
      await ctx.answerCbQuery('Busca cancelada.');
      await ctx.deleteMessage();
    } catch (_) {}
  });

  // ─── Exibição dos Ajudantes e LOG Centralizado ───────────────────────────────

  async function showHelpersAndLog(ctx, variantId, replyId) {
    let [variant, helpers] = await Promise.all([
      getVariantById(variantId),
      getHelpersForVariant(variantId, 100)
    ]);

    if (!variant) return;

    helpers = shuffleArray(helpers).slice(0, 15);

    const emoji = catEmoji(variant.category_code);
    
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
      text += `\n<i>Responda uma mensagem de quem te ajudar com /agradecer para registrar o ato!</i>`;
    }

    let sentMsg;
    try {
      sentMsg = await ctx.reply(text, { 
        parse_mode: 'HTML',
        ...(replyId && { reply_to_message_id: replyId })
      });
    } catch (replyError) {
      console.warn('[WARN] Falha ao dar reply. Enviando mensagem solta...', replyError.message);
      sentMsg = await ctx.reply(text, { parse_mode: 'HTML' });
    }

    // --- DIÁRIO / LOG DE COMUNIDADE ---
    try {
      const configModule = require('../../config/config');
      if (configModule.logGroup?.status && configModule.logGroup?.id) {
        const logText = 
          `🌐 <b>Log de Ajuda:</b> Alguém confirmou busca de ajuda no grupo!\n` +
          `${emoji} ${safeSpriteName} (${safeCategoryName})\n` +
          `👤 <b>Usuário:</b> ${escapeHTML(ctx.from.first_name) || 'User'}`;
        
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