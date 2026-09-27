'use strict';

const catalogDb = require('../db/catalogDb');
const { checkAdminPermission } = require('../db/permissionDb');
const uiService = require('../services/uiService');

module.exports = (bot) => {

  async function requireAdmin(ctx) {
    const permission = await checkAdminPermission(ctx.from.id);
    if (!permission || !permission.isAdmin) {
      await ctx.answerCbQuery('❌ ACESSO NEGADO\n\nApenas administradores podem utilizar este painel de controle.', { show_alert: true });
      return false;
    }
    return true;
  }

  bot.command('configelemental', async (ctx) => {
    const replyId = ctx.message?.message_id;

    try {
      const permission = await checkAdminPermission(ctx.from.id);
      if (!permission || !permission.isAdmin) {
        return ctx.reply('❌ Apenas administradores podem usar este comando.', { reply_to_message_id: replyId });
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '📁 1. Gerenciar Categorias', callback_data: 'adm_el_menu_cat' }],
          [{ text: '👾 2. Gerenciar Elementais (Sprites)', callback_data: 'adm_el_menu_spr' }],
          [{ text: '🃏 3. Gerenciar Variantes (Cartas)', callback_data: 'adm_el_menu_var' }]
        ]
      };

      return ctx.reply(
        '⚙️ <b>Painel de Controle: Elementais</b>\n\nEscolha o que deseja gerenciar nas tabelas do banco de dados:',
        { parse_mode: 'HTML', reply_markup: keyboard, reply_to_message_id: replyId }
      );

    } catch (error) {
      return ctx.reply(`❌ Erro ao abrir o painel: ${error.message}`, { reply_to_message_id: replyId });
    }
  });

  bot.action(['adm_el_open_from_img', 'adm_el_main'], async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    try {
      await ctx.answerCbQuery();
      const keyboard = {
        inline_keyboard: [
          [{ text: '📁 1. Gerenciar Categorias', callback_data: 'adm_el_menu_cat' }],
          [{ text: '👾 2. Gerenciar Elementais (Sprites)', callback_data: 'adm_el_menu_spr' }],
          [{ text: '🃏 3. Gerenciar Variantes (Cartas)', callback_data: 'adm_el_menu_var' }]
        ]
      };
      const text = '⚙️ <b>Painel de Controle: Elementais</b>\n\nEscolha o que deseja gerenciar nas tabelas do banco de dados:';
      
      if (ctx.match[0] === 'adm_el_main') {
        await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
      } else {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
      }
    } catch (error) {}
  });

  bot.action('adm_el_menu_cat', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    try {
      await ctx.answerCbQuery();
      const categories = await catalogDb.getAllCategories();
      const keyboard = categories.map(cat => [
        { text: `${uiService.catEmoji(cat.code)} ${cat.name}`, callback_data: 'noop' },
        { text: cat.is_active === 1 ? '✅ Ativo' : '❌ Inativo', callback_data: `adm_el_tog_cat_${cat.id_elemental_category}` }
      ]);
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageText(
        '📁 <b>Gerenciamento de Categorias (Global)</b>\n\nAtive/desative categorias inteiras. Isso define se a aba da categoria aparece nos menus para os usuários:',
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } }
      );
    } catch (error) {}
  });

  bot.action(/^adm_el_tog_cat_(\d+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    const categoryId = parseInt(ctx.match[1]);
    try {
      await catalogDb.toggleCategoryStatus(categoryId);
      await ctx.answerCbQuery('Visibilidade da Categoria atualizada!');
      
      const categories = await catalogDb.getAllCategories();
      const keyboard = categories.map(cat => [
        { text: `${uiService.catEmoji(cat.code)} ${cat.name}`, callback_data: 'noop' },
        { text: cat.is_active === 1 ? '✅ Ativo' : '❌ Inativo', callback_data: `adm_el_tog_cat_${cat.id_elemental_category}` }
      ]);
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard });
    } catch (error) {
      console.error(error);
      await ctx.answerCbQuery('❌ Erro ao alterar status da categoria.', { show_alert: true });
    }
  });

  bot.action('adm_el_menu_spr', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    try {
      await ctx.answerCbQuery();
      const sprites = await catalogDb.getAllSpritesAdmin();
      const keyboard = sprites.map(spr => [
        { text: `👾 ${spr.name}`, callback_data: 'noop' },
        { text: spr.is_active === 1 ? '✅ Ativo' : '❌ Inativo', callback_data: `adm_el_tog_spr_${spr.id_elemental_sprite}` }
      ]);
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageText(
        '👾 <b>Gerenciamento de Personagens (Sprites)</b>\n\nAtivar um elemental base puxará ele e suas cartas para a temporada atual (Unvault):',
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } }
      );
    } catch (error) {}
  });

  bot.action(/^adm_el_tog_spr_(\d+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    const spriteId = parseInt(ctx.match[1]);
    try {
      await catalogDb.toggleSpriteStatus(spriteId);
      await ctx.answerCbQuery('Elemental e variantes atualizados!');

      const sprites = await catalogDb.getAllSpritesAdmin();
      const keyboard = sprites.map(spr => [
        { text: `👾 ${spr.name}`, callback_data: 'noop' },
        { text: spr.is_active === 1 ? '✅ Ativo' : '❌ Inativo', callback_data: `adm_el_tog_spr_${spr.id_elemental_sprite}` }
      ]);
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard });
    } catch (error) {
      await ctx.answerCbQuery('❌ Erro técnico ao alterar status do elemental.', { show_alert: true });
    }
  });

  bot.action('adm_el_menu_var', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    try {
      await ctx.answerCbQuery();
      const sprites = await catalogDb.getAllSpritesAdmin();
      const keyboard = sprites.map(spr => [
        { text: `👾 ${spr.name}`, callback_data: 'noop' },
        { text: '➡️ Ver Variantes', callback_data: `adm_el_listsvar_${spr.id_elemental_sprite}` }
      ]);
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageText(
        '🃏 <b>Gerenciamento de Variantes (Cartas)</b>\n\nToque na ➡️ para listar e alterar o status das cartas específicas de cada Elemental:',
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } }
      );
    } catch (error) {}
  });

  async function refreshVariantList(ctx, spriteId) {
    const variants = await catalogDb.getVariantsBySpriteIdAdmin(spriteId);
    const spriteName = await catalogDb.getSpriteNameById(spriteId);

    if (variants.length === 0) {
      return ctx.editMessageText(
        `🃏 <b>Variantes de ${spriteName}</b>\n\nNenhuma variante cadastrada para este elemental.`,
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '⬅️ Voltar aos Elementais', callback_data: 'adm_el_menu_var' }]] } }
      );
    }

    const keyboard = variants.map(v => [
      { text: `${uiService.catEmoji(v.cat_code)} ${v.cat_name}`, callback_data: 'noop' },
      { text: v.is_active === 1 ? '✅ Ativa' : '❌ Inativa', callback_data: `adm_el_tog_var_${v.id_elemental_variant}_${spriteId}` }
    ]);
    keyboard.push([{ text: '⬅️ Voltar aos Elementais', callback_data: 'adm_el_menu_var' }]);

    await ctx.editMessageText(
      `🃏 <b>Variantes de ${spriteName}</b>\n\nLigue ou desligue as cartas de categorias específicas deste elemental:`,
      { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } }
    );
  }

  bot.action(/^adm_el_listsvar_(\d+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    const spriteId = parseInt(ctx.match[1]);
    try {
      await ctx.answerCbQuery();
      await refreshVariantList(ctx, spriteId);
    } catch (error) {}
  });

  bot.action(/^adm_el_tog_var_(\d+)_(\d+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    const variantId = parseInt(ctx.match[1]);
    const spriteId = parseInt(ctx.match[2]);

    try {
      await catalogDb.toggleVariantStatus(variantId);
      await ctx.answerCbQuery('Status da variante atualizado!');
      await refreshVariantList(ctx, spriteId);
    } catch (error) {
      await ctx.answerCbQuery('❌ Erro técnico ao alterar status da variante.', { show_alert: true });
    }
  });

  bot.action('noop', async (ctx) => {
    try { await ctx.answerCbQuery(); } catch (_) {}
  });
};