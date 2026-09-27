'use strict';

const { ensureUser, ensureBotGroup } = require('../../../utils/databaseUtilsMySQL');
const catalogDb = require('../db/catalogDb');
const socialDb = require('../db/socialDb');
const uiService = require('../services/uiService');

// Gerenciador de estado em memória para as sessões de agradecimento múltiplo
const multiThanksSessions = new Map();

module.exports = (bot) => {

  bot.command('agradecer', async (ctx) => {
    const replyId = ctx.message?.message_id;

    try {
      if (ctx.chat.type === 'private') {
        return ctx.reply('⚠️ O comando /agradecer deve ser usado em um grupo!', { reply_to_message_id: replyId });
      }

      const repliedMsg = ctx.message?.reply_to_message;
      if (!repliedMsg) {
        return ctx.reply('⚠️ Você precisa responder a uma mensagem da pessoa que te ajudou para usar este comando!\nExemplo: Responda a mensagem dela com <code>/agradecer Duck</code> ou <code>/agradecer vários</code>', { parse_mode: 'HTML', reply_to_message_id: replyId });
      }

      const helperId = repliedMsg.from.id.toString();
      const helpedId = ctx.from.id.toString();
      const groupId = ctx.chat.id.toString();

      if (helperId === helpedId) {
        return ctx.reply('⚠️ Você não pode agradecer a si mesmo!', { reply_to_message_id: replyId });
      }

      if (repliedMsg.from.is_bot) {
        return ctx.reply('⚠️ Bots não precisam de agradecimentos, mas aprecio muito a intenção! 🤖', { reply_to_message_id: replyId });
      }

      await ensureUser(helpedId, 1, { first_name: ctx.from.first_name, username: ctx.from.username });
      await ensureUser(helperId, 1, { first_name: repliedMsg.from.first_name, username: repliedMsg.from.username });
      await ensureBotGroup(groupId, ctx.chat.title || 'Grupo');

      const args = ctx.message.text.split(/\s+/).slice(1).join(' ').trim().toLowerCase();
      const isMulti = args === 'vários' || args === 'varios' || args === 'múltiplos' || args === 'multiplos';

      // ==========================================
      // FLUXO 1: AGRADECIMENTO MÚLTIPLO
      // ==========================================
      if (isMulti) {
        // Inicializa a sessão para este usuário
        multiThanksSessions.set(helpedId, {
          helperId,
          helperName: repliedMsg.from.first_name,
          helperUsername: repliedMsg.from.username,
          groupId,
          selectedVariants: new Set()
        });

        return await renderMultiCategoryMenu(ctx, helpedId, true, replyId);
      }

      // ==========================================
      // FLUXO 2: AGRADECIMENTO ÚNICO (ORIGINAL)
      // ==========================================
      let variantId = null;
      let spriteName = '';
      let targetCategoryName = '';

      if (args) {
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
          return ctx.reply(`🔍 Nenhum sprite encontrado com o nome "<b>${spriteNameInput}</b>".\nVerifique o nome correto ou use apenas <code>/agradecer</code> para um agradecimento geral.`, { parse_mode: 'HTML', reply_to_message_id: replyId });
        }

        const variants = await catalogDb.getVariantsBySpriteId(sprites[0].id_elemental_sprite);
        
        if (variants.length > 0) {
          if (targetCategory) {
            const variantMatch = variants.find(v => v.fk_id_category === targetCategory.id_elemental_category);
            if (variantMatch) {
              variantId = variantMatch.id_elemental_variant;
              spriteName = sprites[0].name;
              targetCategoryName = targetCategory.name;
            } else {
              variantId = variants[0].id_elemental_variant;
              spriteName = sprites[0].name;
            }
          } else {
            variantId = variants[0].id_elemental_variant;
            spriteName = sprites[0].name;
          }
        }
      }

      await socialDb.recordHelp(helperId, helpedId, groupId, variantId);

      const helperConfig = await socialDb.getUserElementalConfig(helperId);
      const helperFirstName = repliedMsg.from.first_name;

      let mention = helperFirstName;
      if (helperConfig.allow_group_mention) {
        mention = repliedMsg.from.username
          ? `@${repliedMsg.from.username}`
          : `<a href="tg://user?id=${helperId}">${helperFirstName}</a>`;
      } else {
        mention = `<b>${helperFirstName}</b>`;
      }

      let text = `🎉 <b>Agradecimento Registrado!</b>\n\n`;
      if (spriteName) {
        const fullSpriteDisplayName = targetCategoryName ? `${spriteName} ${targetCategoryName}` : spriteName;
        text += `${ctx.from.first_name} registrou que conseguiu o sprite <b>${fullSpriteDisplayName}</b> com a ajuda de ${mention}.\n\n`;
      } else {
        text += `${ctx.from.first_name} registrou um agradecimento pela ajuda de ${mention}.\n\n`;
      }
      text += `Obrigado por fortalecer a comunidade! 🛡️`;

      return ctx.reply(text, { parse_mode: 'HTML', reply_to_message_id: replyId });

    } catch (error) {
      console.error('[ERROR] /agradecer:', error.message);
      await ctx.reply('❌ Erro ao registrar o agradecimento. Tente novamente mais tarde.', { reply_to_message_id: replyId });
    }
  });


  // =========================================================================
  // ACTIONS DO FLUXO MULTIPLO
  // =========================================================================

  async function renderMultiCategoryMenu(ctx, userId, isNew, replyId = null) {
    const session = multiThanksSessions.get(userId);
    if (!session) return ctx.answerCbQuery ? ctx.answerCbQuery('❌ Sessão expirada.', { show_alert: true }) : null;

    const categories = await catalogDb.getElementalCategories();
    const count = session.selectedVariants.size;

    const inline_keyboard = categories.map(c => [{
      text: `${uiService.catEmoji(c.code)} ${c.name}`,
      callback_data: `el_agr_cat_${c.id_elemental_category}_${userId}`
    }]);

    inline_keyboard.push([{ text: `✅ Encerrar (${count} selecionados)`, callback_data: `el_agr_end_${userId}` }]);
    inline_keyboard.push([{ text: '❌ Cancelar', callback_data: `el_agr_cancel_${userId}` }]);

    const text = `🤝 <b>Agradecimento Múltiplo para ${session.helperName}</b>\n\nEscolha a categoria dos elementais que você recebeu:`;

    if (isNew) {
      return ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard }, reply_to_message_id: replyId });
    } else {
      return ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard } });
    }
  }

  // Clica na categoria para ver os elementais
  bot.action(/^el_agr_cat_(\d+)_(\d+)$/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const userId = ctx.match[2];

    if (ctx.from.id.toString() !== userId) return ctx.answerCbQuery('⚠️ Este menu não é seu!', { show_alert: true });
    
    const session = multiThanksSessions.get(userId);
    if (!session) return ctx.answerCbQuery('❌ Sessão expirada.', { show_alert: true });

    try {
      const [category, variants] = await Promise.all([
        catalogDb.getCategoryByCode((await catalogDb.getElementalCategories()).find(c => c.id_elemental_category === categoryId).code),
        catalogDb.getVariantsByCategory(categoryId)
      ]);

      const inline_keyboard = variants.map(v => {
        const isSelected = session.selectedVariants.has(v.id_elemental_variant);
        return [
          { text: v.sprite_name, callback_data: `noop` },
          { text: isSelected ? '✅' : '☑️', callback_data: `el_agr_tog_${v.id_elemental_variant}_${categoryId}_${userId}` }
        ];
      });

      inline_keyboard.push([{ text: '⬅️ Voltar', callback_data: `el_agr_back_${userId}` }]);
      inline_keyboard.push([{ text: `✅ Encerrar (${session.selectedVariants.size} selecionados)`, callback_data: `el_agr_end_${userId}` }]);

      const text = `${uiService.catEmoji(category.code)} <b>${category.name}</b>\n\nMarque quais sprites o(a) <b>${session.helperName}</b> te ajudou a conseguir:`;
      
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard } });
      await ctx.answerCbQuery();
    } catch (e) {
      await ctx.answerCbQuery('Erro.', { show_alert: true });
    }
  });

  // Marca/Desmarca um elemental
  bot.action(/^el_agr_tog_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    const categoryId = parseInt(ctx.match[2]);
    const userId = ctx.match[3];

    if (ctx.from.id.toString() !== userId) return ctx.answerCbQuery('⚠️ Este menu não é seu!', { show_alert: true });
    
    const session = multiThanksSessions.get(userId);
    if (!session) return ctx.answerCbQuery('❌ Sessão expirada.', { show_alert: true });

    if (session.selectedVariants.has(variantId)) {
      session.selectedVariants.delete(variantId);
    } else {
      session.selectedVariants.add(variantId);
    }

    // Recarrega a tela da categoria atual
    ctx.match[1] = categoryId; 
    ctx.match[2] = userId;
    
    // Hack rápido para reaproveitar a action da categoria
    const payload = { match: [null, categoryId, userId], from: ctx.from, answerCbQuery: ctx.answerCbQuery, editMessageText: ctx.editMessageText };
    const categoryLogic = bot.action.handlers ? bot.action.handlers.find(h => h.trigger.toString() === '/^el_agr_cat_(\\d+)_(\\d+)$/') : null;
    
    try {
      const [category, variants] = await Promise.all([
        catalogDb.getCategoryByCode((await catalogDb.getElementalCategories()).find(c => c.id_elemental_category === categoryId).code),
        catalogDb.getVariantsByCategory(categoryId)
      ]);

      const inline_keyboard = variants.map(v => {
        const isSelected = session.selectedVariants.has(v.id_elemental_variant);
        return [
          { text: v.sprite_name, callback_data: `noop` },
          { text: isSelected ? '✅' : '☑️', callback_data: `el_agr_tog_${v.id_elemental_variant}_${categoryId}_${userId}` }
        ];
      });

      inline_keyboard.push([{ text: '⬅️ Voltar', callback_data: `el_agr_back_${userId}` }]);
      inline_keyboard.push([{ text: `✅ Encerrar (${session.selectedVariants.size} selecionados)`, callback_data: `el_agr_end_${userId}` }]);

      const text = `${uiService.catEmoji(category.code)} <b>${category.name}</b>\n\nMarque quais sprites o(a) <b>${session.helperName}</b> te ajudou a conseguir:`;
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard } });
    } catch (e) {}
  });

  bot.action(/^el_agr_back_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    if (ctx.from.id.toString() !== userId) return ctx.answerCbQuery('⚠️ Este menu não é seu!', { show_alert: true });
    await renderMultiCategoryMenu(ctx, userId, false);
  });

  bot.action(/^el_agr_cancel_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    if (ctx.from.id.toString() !== userId) return ctx.answerCbQuery('⚠️ Este menu não é seu!', { show_alert: true });
    multiThanksSessions.delete(userId);
    await ctx.answerCbQuery('Agradecimento múltiplo cancelado.');
    await ctx.deleteMessage().catch(()=>{});
  });

  bot.action(/^el_agr_end_(\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    if (ctx.from.id.toString() !== userId) return ctx.answerCbQuery('⚠️ Este menu não é seu!', { show_alert: true });
    
    const session = multiThanksSessions.get(userId);
    if (!session) return ctx.answerCbQuery('❌ Sessão expirada.', { show_alert: true });

    if (session.selectedVariants.size === 0) {
      return ctx.answerCbQuery('⚠️ Você precisa selecionar pelo menos um sprite antes de encerrar!', { show_alert: true });
    }

    try {
      await ctx.answerCbQuery('Registrando agradecimentos...');
      
      const variantIds = Array.from(session.selectedVariants);
      await socialDb.recordMultipleHelps(session.helperId, userId, session.groupId, variantIds);

      const helperConfig = await socialDb.getUserElementalConfig(session.helperId);
      let mention = session.helperName;
      if (helperConfig.allow_group_mention) {
        mention = session.helperUsername ? `@${session.helperUsername}` : `<a href="tg://user?id=${session.helperId}">${session.helperName}</a>`;
      } else {
        mention = `<b>${session.helperName}</b>`;
      }

      const text = `🎉 <b>Agradecimento Registrado em Massa!</b>\n\n${ctx.from.first_name} registrou que conseguiu <b>${variantIds.length} sprites</b> com a ajuda de ${mention}.\n\nObrigado por fortalecer a comunidade! 🛡️`;
      
      await ctx.editMessageText(text, { parse_mode: 'HTML' });
      multiThanksSessions.delete(userId);

    } catch (error) {
      console.error('[ERROR] el_agr_end:', error.message);
      await ctx.answerCbQuery('❌ Erro ao registrar os agradecimentos.', { show_alert: true });
    }
  });

};