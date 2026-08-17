const { query } = require('../../database/dbConnection');
const config = require('../../config/config');
const { checkAdminPermission } = require('./addAdmin');
const { catEmoji } = require('../user/elementalCommon');

module.exports = (bot) => {

  // ─── FUNÇÃO AUXILIAR: VALIDAÇÃO DE ADMIN E BLOQUEIO DE TELA ─────────────────
  async function requireAdmin(ctx) {
    const permission = await checkAdminPermission(ctx.from.id);
    if (!permission || !permission.isAdmin) {
      // show_alert: true cria o pop-up bloqueando a tela requerendo clique em "OK"
      await ctx.answerCbQuery('❌ ACESSO NEGADO\n\nApenas administradores podem utilizar este painel de controle.', { show_alert: true });
      return false;
    }
    return true;
  }

  // ─── COMANDO PRINCIPAL ──────────────────────────────────────────────────────
  bot.command('configelemental', async (ctx) => {
    console.log('[CONFIG ELEMENTAL] Comando /configelemental acionado');
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
      console.error('[ERROR] Falha crítica no /configelemental:', error.message);
      return ctx.reply(`❌ Erro ao abrir o painel: ${error.message}`, { reply_to_message_id: replyId });
    }
  });


  // ─── AÇÃO DO BOTÃO NA IMAGEM DO LOG ──────────────────────────────────────────
  bot.action(/^adm_el_imgtog_(\d+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    const variantId = parseInt(ctx.match[1]);
    try {
      // 1. Inverte o status no banco de dados
      await query('UPDATE tb_elemental_variant SET is_active = 1 - is_active WHERE id_elemental_variant = ?', [variantId]);

      // 2. Busca o novo status atualizado
      const vInfo = await query('SELECT is_active FROM tb_elemental_variant WHERE id_elemental_variant = ?', [variantId]);
      const isActive = vInfo[0].is_active === 1;
      const statusIcon = isActive ? '✅ Ativo' : '❌ Inativo';

      await ctx.answerCbQuery(`Status alterado para: ${statusIcon}`);

      // 3. Atualiza os botões da foto no Telegram em tempo real
      const newKeyboard = {
        inline_keyboard: [
          [
            { text: 'Visibilidade', callback_data: 'noop' },
            { text: statusIcon, callback_data: `adm_el_imgtog_${variantId}` }
          ]
        ]
      };

      await ctx.editMessageReplyMarkup(newKeyboard);
    } catch (error) {
      console.error('[ERROR] adm_el_imgtog:', error.message);
      await ctx.answerCbQuery('❌ Erro técnico ao alterar status da variante.', { show_alert: true });
    }
  });

  // 2. Abrir o painel de configurações gerais a partir da foto
  bot.action('adm_el_open_from_img', async (ctx) => {
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
      
      // Como o botão foi clicado em uma FOTO, enviamos uma NOVA MENSAGEM em vez de tentar editar a foto em texto
      await ctx.reply(
        '⚙️ <b>Painel de Controle: Elementais</b>\n\nEscolha o que deseja gerenciar nas tabelas do banco de dados:',
        { parse_mode: 'HTML', reply_markup: keyboard }
      );
    } catch (error) {
      console.error('[ERROR] adm_el_open_from_img:', error.message);
    }
  });


  // ─── RETORNO AO MENU PRINCIPAL ──────────────────────────────────────────────
  bot.action('adm_el_main', async (ctx) => {
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
      await ctx.editMessageText(
        '⚙️ <b>Painel de Controle: Elementais</b>\n\nEscolha o que deseja gerenciar nas tabelas do banco de dados:',
        { parse_mode: 'HTML', reply_markup: keyboard }
      );
    } catch (error) {
      console.error('[ERROR] adm_el_main:', error.message);
    }
  });

  // ─── FLUXO 1: GERENCIAR CATEGORIAS ──────────────────────────────────────────
  bot.action('adm_el_menu_cat', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    try {
      await ctx.answerCbQuery();
      const categories = await query('SELECT id_elemental_category, code, name, is_active FROM tb_elemental_category ORDER BY display_order ASC');
      const keyboard = [];
      
      categories.forEach(cat => {
        const emoji = catEmoji(cat.code);
        const statusIcon = cat.is_active === 1 ? '✅ Ativo' : '❌ Inativo';
        keyboard.push([
          { text: `${emoji} ${cat.name}`, callback_data: 'noop' },
          { text: statusIcon, callback_data: `adm_el_tog_cat_${cat.id_elemental_category}` }
        ]);
      });
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageText(
        '📁 <b>Gerenciamento de Categorias (Global)</b>\n\nAtive/desative categorias inteiras. Isso afeta a exibição de todas as cartas ligadas a ela:',
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } }
      );
    } catch (error) {
      console.error('[ERROR] adm_el_menu_cat:', error.message);
    }
  });

  bot.action(/^adm_el_tog_cat_(\d+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    const categoryId = parseInt(ctx.match[1]);
    try {
      await query('UPDATE tb_elemental_category SET is_active = 1 - is_active WHERE id_elemental_category = ?', [categoryId]);
      const catInfo = await query('SELECT is_active FROM tb_elemental_category WHERE id_elemental_category = ?', [categoryId]);
      const newStatus = catInfo[0].is_active;

      await query('UPDATE tb_elemental_variant SET is_active = ? WHERE fk_id_category = ?', [newStatus, categoryId]);
      await ctx.answerCbQuery('Categoria e variantes atualizadas!');
      
      // Recarrega o menu
      const categories = await query('SELECT id_elemental_category, code, name, is_active FROM tb_elemental_category ORDER BY display_order ASC');
      const keyboard = [];
      categories.forEach(cat => {
        const emoji = catEmoji(cat.code);
        const statusIcon = cat.is_active === 1 ? '✅ Ativo' : '❌ Inativo';
        keyboard.push([
          { text: `${emoji} ${cat.name}`, callback_data: 'noop' },
          { text: statusIcon, callback_data: `adm_el_tog_cat_${cat.id_elemental_category}` }
        ]);
      });
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard });
    } catch (error) {
      console.error('[ERROR] adm_el_tog_cat:', error.message);
      await ctx.answerCbQuery('❌ Erro ao alterar status da categoria.', { show_alert: true });
    }
  });

  // ─── FLUXO 2: GERENCIAR ELEMENTAIS / SPRITES ────────────────────────────────
  bot.action('adm_el_menu_spr', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    try {
      await ctx.answerCbQuery();
      const sprites = await query('SELECT id_elemental_sprite, name, is_active FROM tb_elemental_sprite ORDER BY display_order ASC, name ASC');
      const keyboard = [];
      
      sprites.forEach(spr => {
        const statusIcon = spr.is_active === 1 ? '✅ Ativo' : '❌ Inativo';
        keyboard.push([
          { text: `👾 ${spr.name}`, callback_data: 'noop' },
          { text: statusIcon, callback_data: `adm_el_tog_spr_${spr.id_elemental_sprite}` }
        ]);
      });
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageText(
        '👾 <b>Gerenciamento de Personagens (Sprites)</b>\n\nDesativar um elemental base esconderá todas as suas variantes do catálogo:',
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } }
      );
    } catch (error) {
      console.error('[ERROR] adm_el_menu_spr:', error.message);
    }
  });

  bot.action(/^adm_el_tog_spr_(\d+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    const spriteId = parseInt(ctx.match[1]);
    try {
      await query('UPDATE tb_elemental_sprite SET is_active = 1 - is_active WHERE id_elemental_sprite = ?', [spriteId]);
      const sprInfo = await query('SELECT is_active FROM tb_elemental_sprite WHERE id_elemental_sprite = ?', [spriteId]);
      const newStatus = sprInfo[0].is_active;

      await query('UPDATE tb_elemental_variant SET is_active = ? WHERE fk_id_sprite = ?', [newStatus, spriteId]);
      await ctx.answerCbQuery('Elemental e variantes atualizados!');

      // Recarrega o menu
      const sprites = await query('SELECT id_elemental_sprite, name, is_active FROM tb_elemental_sprite ORDER BY display_order ASC, name ASC');
      const keyboard = [];
      sprites.forEach(spr => {
        const statusIcon = spr.is_active === 1 ? '✅ Ativo' : '❌ Inativo';
        keyboard.push([
          { text: `👾 ${spr.name}`, callback_data: 'noop' },
          { text: statusIcon, callback_data: `adm_el_tog_spr_${spr.id_elemental_sprite}` }
        ]);
      });
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard });
    } catch (error) {
      console.error('[ERROR] adm_el_tog_spr:', error.message);
      await ctx.answerCbQuery('❌ Erro técnico ao alterar status do elemental.', { show_alert: true });
    }
  });

  // ─── FLUXO 3: GERENCIAR VARIANTES (CARTAS) ──────────────────────────────────
  bot.action('adm_el_menu_var', async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    try {
      await ctx.answerCbQuery();
      const sprites = await query('SELECT id_elemental_sprite, name FROM tb_elemental_sprite ORDER BY display_order ASC, name ASC');
      const keyboard = [];
      
      sprites.forEach(spr => {
        keyboard.push([
          { text: `👾 ${spr.name}`, callback_data: 'noop' },
          { text: '➡️ Ver Variantes', callback_data: `adm_el_listsvar_${spr.id_elemental_sprite}` }
        ]);
      });
      keyboard.push([{ text: '⬅️ Voltar ao Menu', callback_data: 'adm_el_main' }]);

      await ctx.editMessageText(
        '🃏 <b>Gerenciamento de Variantes (Cartas)</b>\n\nToque na ➡️ para listar e alterar o status das cartas específicas de cada Elemental:',
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } }
      );
    } catch (error) {
      console.error('[ERROR] adm_el_menu_var:', error.message);
    }
  });

  async function refreshVariantList(ctx, spriteId) {
    const variants = await query(
      `SELECT v.id_elemental_variant, c.name AS cat_name, c.code AS cat_code, v.is_active 
       FROM tb_elemental_variant v
       JOIN tb_elemental_category c ON v.fk_id_category = c.id_elemental_category
       WHERE v.fk_id_sprite = ?
       ORDER BY c.display_order ASC`,
      [spriteId]
    );

    const spriteInfo = await query('SELECT name FROM tb_elemental_sprite WHERE id_elemental_sprite = ?', [spriteId]);
    const spriteName = spriteInfo[0]?.name || 'Elemental';

    if (variants.length === 0) {
      return ctx.editMessageText(
        `🃏 <b>Variantes de ${spriteName}</b>\n\nNenhuma variante cadastrada para este elemental.`,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '⬅️ Voltar aos Elementais', callback_data: 'adm_el_menu_var' }]] }
        }
      );
    }

    const keyboard = [];
    variants.forEach(v => {
      const emoji = catEmoji(v.cat_code);
      const statusIcon = v.is_active === 1 ? '✅ Ativa' : '❌ Inativa';
      keyboard.push([
        { text: `${emoji} ${v.cat_name}`, callback_data: 'noop' },
        { text: statusIcon, callback_data: `adm_el_tog_var_${v.id_elemental_variant}_${spriteId}` }
      ]);
    });
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
    } catch (error) {
      console.error('[ERROR] adm_el_listsvar:', error.message);
    }
  });

  bot.action(/^adm_el_tog_var_(\d+)_(\d+)$/, async (ctx) => {
    if (!(await requireAdmin(ctx))) return;

    const variantId = parseInt(ctx.match[1]);
    const spriteId = parseInt(ctx.match[2]);

    try {
      await query('UPDATE tb_elemental_variant SET is_active = 1 - is_active WHERE id_elemental_variant = ?', [variantId]);
      await ctx.answerCbQuery('Status da variante atualizado!');
      await refreshVariantList(ctx, spriteId);
    } catch (error) {
      console.error('[ERROR] adm_el_tog_var:', error.message);
      await ctx.answerCbQuery('❌ Erro técnico ao alterar status da variante.', { show_alert: true });
    }
  });

  // ─── AUXILIAR: BOTÕES SEM AÇÃO ──────────────────────────────────────────────
  bot.action('noop', async (ctx) => {
    try { await ctx.answerCbQuery(); } catch (_) {}
  });
};