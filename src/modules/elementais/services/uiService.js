'use strict';

const fs = require('fs');
const catalogDb = require('../db/catalogDb');
const collectionDb = require('../db/collectionDb');

// ─── Emojis por categoria ─────────────────────────────────────────────────────
const CATEGORY_EMOJI = {
  basic: '⚪', gold: '🟡', candy: '🍬', galaxy: '🌌',
  gem: '💎', holofoil: '✨', cube: '🟣', special: '⭐',
  trapaceiro: '🃏',
};

function catEmoji(code) {
  return CATEGORY_EMOJI[code] || '🔹';
}

function buildVariantCaption(variant) {
  const emoji = catEmoji(variant.category_code);
  
  let caption =
    `${emoji} <b>${variant.sprite_name}</b>\n` +
    `📁 <i>Categoria: ${variant.category_name}</i>\n`;

  if (variant.rarity_name) caption += `⚗️ Raridade: <b>${variant.rarity_name}</b>\n`;
  if (variant.location) caption += `📍 Local: ${variant.location}\n`;
  if (variant.summon_cost) caption += `💰 Custo de invocação: ${variant.summon_cost}\n`;
  if (variant.drop_chance) caption += `🎲 Chance de obtenção: ${variant.drop_chance}%\n`;
  if (variant.sprite_description) caption += `\n📖 <i>${variant.sprite_description}</i>`;

  return caption.trim();
}

function buildProgressBar(current, total, length = 5) {
  if (total === 0) return '○'.repeat(length);
  const filled = Math.round((current / total) * length);
  return '●'.repeat(filled) + '○'.repeat(length - filled);
}

function chunkButtons(buttonsArray, columns = 2) {
  const result = [];
  for (let i = 0; i < buttonsArray.length; i += columns) {
    result.push(buttonsArray.slice(i, i + columns));
  }
  return result;
}

// ─── Helper de Envio Centralizado (PÚBLICO) ──────────────────────────────────
async function sendDocumentOrPhoto(ctx, mosaicPath, replyOptions, isDocument, userId) {
  try {
    if (isDocument) {
      await ctx.replyWithDocument(
        { source: fs.createReadStream(mosaicPath), filename: `colecao_${userId}.jpg` },
        replyOptions
      );
    } else {
      await ctx.replyWithPhoto(
        { source: fs.createReadStream(mosaicPath) },
        replyOptions
      );
    }
  } catch (error) {
    console.error('[ERRO] Falha ao enviar mosaico:', error.message);
    // Tenta enviar novamente em caso de erro leve de stream
    if (isDocument) {
      await ctx.replyWithDocument({ source: fs.createReadStream(mosaicPath), filename: `colecao_${userId}.jpg` }, replyOptions);
    } else {
      await ctx.replyWithPhoto({ source: fs.createReadStream(mosaicPath) }, replyOptions);
    }
  }
}

async function sendConfigMenu(ctx, config, isEdit) {
  const helpBtn = config.accept_help_requests ? '✅ Aceitar pedidos de ajuda' : '❌ Aceitar pedidos de ajuda';
  const dmBtn = config.allow_private_messages ? '✅ Permitir mensagens privadas' : '❌ Permitir mensagens privadas';
  const mentionBtn = config.allow_group_mention ? '✅ Permitir marcação no grupo' : '❌ Permitir marcação no grupo';

  const text =
    '⚙️ <b>Configurações — Sprites Elementais</b>\n\n' +
    'Toque em uma opção para alternar:\n\n' +
    `• Pedidos de ajuda: <b>${config.accept_help_requests ? 'Ativado' : 'Desativado'}</b>\n` +
    `• Mensagens privadas: <b>${config.allow_private_messages ? 'Ativado' : 'Desativado'}</b>\n` +
    `• Marcação no grupo: <b>${config.allow_group_mention ? 'Ativado' : 'Desativado'}</b>`;

  const keyboard = {
    inline_keyboard: [
      [{ text: helpBtn, callback_data: 'el_cfg_help' }],
      [{ text: dmBtn, callback_data: 'el_cfg_dm' }],
      [{ text: mentionBtn, callback_data: 'el_cfg_mention' }],
      [{ text: '⬅️ Voltar ao Perfil', callback_data: 'el_perfil' }],
      [{ text: '🖼️ Gerar imagem da coleção', callback_data: 'el_updatemosaic' }],
      [{ text: '🗑️ Fechar', callback_data: 'el_close' }]
    ],
  };

  if (isEdit) return ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
  return ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
}

async function sendCategoryMenu(ctx, isEdit) {
  const categories = await catalogDb.getElementalCategories();

  if (categories.length === 0) {
    const msg = '❌ Nenhuma categoria disponível no momento.';
    return isEdit ? ctx.editMessageText(msg) : ctx.reply(msg);
  }

  const text = '🌟 <b>Sprites Elementais</b>\n\nEscolha uma categoria para explorar:';

  const inline_keyboard = categories.map(c => {
    return [{
      text: `${catEmoji(c.code)} ${c.name}`,
      callback_data: `el_cat_${c.id_elemental_category}`,
    }];
  });

  inline_keyboard.push([{ text: '🖼️ Gerar imagem da coleção', callback_data: 'el_updatemosaic' }]);
  inline_keyboard.push([
    { text: '🔙 Voltar aos Modos', callback_data: 'el_mode_select' },
    { text: '🗑️ Fechar', callback_data: 'el_close' }
  ]);

  if (isEdit) return ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard } });
  return ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard } });
}

async function sendSpriteList(ctx, categoryId, isEdit, userId) {
  const [categories, variants] = await Promise.all([
    catalogDb.getElementalCategories(),
    catalogDb.getVariantsByCategory(categoryId),
  ]);

  const category = categories.find(c => c.id_elemental_category == categoryId);

  if (!category) {
    const msg = '❌ Categoria não encontrada.';
    const kb = { inline_keyboard: [[{ text: '⬅️ Categorias', callback_data: 'el_back_cat' }]] };
    return isEdit ? ctx.editMessageText(msg, { reply_markup: kb }) : ctx.reply(msg, { reply_markup: kb });
  }

  const ownedIds = userId ? await collectionDb.getUserCollectionIds(userId) : new Set();
  const dominatedIds = userId ? await collectionDb.getUserDominatedIds(userId) : new Set();

  const emoji = catEmoji(category.code);
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

  if (isEdit) return ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: spriteButtons } });
  return ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: spriteButtons } });
}

module.exports = {
  catEmoji,
  buildVariantCaption,
  buildProgressBar,
  chunkButtons,
  sendDocumentOrPhoto,
  sendConfigMenu,
  sendCategoryMenu,
  sendSpriteList
};