'use strict';

const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const {
  getElementalCategories,
  getVariantsByCategory,
  getUserCollectionIds,
  getAllVariants,
  getUserDominatedIds
} = require('../../utils/databaseUtilsMySQL');

// Caminho base para as imagens do modulo
const IMAGES_BASE = path.join(__dirname, '../../src/assets/images/');

// ─── Emojis por categoria ─────────────────────────────────────────────────────

const CATEGORY_EMOJI = {
  basic: '⚪',
  gold: '🟡',
  candy: '🍬',
  galaxy: '🌌',
  gem: '💎',
  holofoil: '✨',
  cube: '🟣',
  special: '⭐',
};

function catEmoji(code) {
  return CATEGORY_EMOJI[code] || '🔹';
}

// ─── Montagem da caption da ficha de uma variante ──────────────────────────────────────────

/**
 * Constrói a legenda HTML da ficha de uma variante.
 * Reutilizada por el_var, el_toggle e /sprite.
 * @param {object} variant - Linha retornada por getVariantById()
 * @returns {string}
 */
function buildVariantCaption(variant) {
  const emoji = catEmoji(variant.category_code);
  let caption =
    `${emoji} <b>${variant.sprite_name}</b>\n` +
    `\uD83D\uDDC2 <i>Categoria: ${variant.category_name}</i>\n`;

  if (variant.rarity_name) caption += `⚗️ Raridade: <b>${variant.rarity_name}</b>\n`;
  if (variant.location) caption += `\uD83D\uDCCD Local: ${variant.location}\n`;
  if (variant.summon_cost) caption += `\uD83D\uDCB0 Custo de invocação: ${variant.summon_cost}\n`;
  if (variant.drop_chance) caption += `\uD83C\uDFB2 Chance de obtenção: ${variant.drop_chance}%\n`;
  if (variant.sprite_description) caption += `\n\uD83D\uDCD6 <i>${variant.sprite_description}</i>`;

  return caption.trim();
}

// ─── Barra de progresso visual ──────────────────────────────────────────────────

/**
 * Gera uma barra de progresso visual em texto (ex: ●●●○○).
 * @param {number} current - Quantidade atual
 * @param {number} total   - Quantidade total
 * @param {number} length  - Tamanho da barra (padrão 5)
 * @returns {string}
 */
function buildProgressBar(current, total, length = 5) {
  if (total === 0) return '○'.repeat(length);
  const filled = Math.round((current / total) * length);
  return '●'.repeat(filled) + '○'.repeat(length - filled);
}
// ─── Rotina de Geração do Mosaico da Coleção (Jimp) ───────────────────────────

async function generateCollectionMosaic(userId) {
  try {
    const [ownedVariantIds, allVariants] = await Promise.all([
      getUserCollectionIds(userId),
      getAllVariants()
    ]);

    const baseBackgroundPath = path.join(IMAGES_BASE, 'background/bg-v.png');
    const outputDir = path.join(IMAGES_BASE, 'elementais/temp_mosaics');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `collection_${userId}.png`);
    const baseImage = await Jimp.read(baseBackgroundPath);

    // Filtra apenas o que é da coleção E está ativo no banco
    const ownedVariants = allVariants.filter(v =>
      ownedVariantIds.has(v.id_elemental_variant) &&
      v.is_active === 1 && 
      v.image
    );
    const totalImagens = ownedVariants.length;

    if (totalImagens === 0) {
      await baseImage.writeAsync(outputPath);
      return outputPath;
    }

    // ─── DEFINIÇÃO DO TAMANHO FIXO DO SPRITE ────────────────────────────────
    const spriteWidth = 250;
    // Ajustado exatamente para a proporção vertical das suas imagens originais (1024x1536)
    const propCard = 1024 / 1536;
    const spriteHeight = Math.round(spriteWidth / propCard); // Resulta em ~255px

    const borderThickness = 2;
    const borderColor = 0x00000044;

    // ─── LÓGICA DE GRADE COMPENSADA (BLOCO VISUALMENTE QUADRADO) ───────────
    const aspectoImagem = spriteHeight / spriteWidth; // 1.5

    const numCols = Math.max(1, Math.round(Math.sqrt(totalImagens * aspectoImagem)));
    const numRows = Math.ceil(totalImagens / numCols); 

    const totalGridWidth = numCols * spriteWidth;
    const totalGridHeight = numRows * spriteHeight;

    baseImage.resize(totalGridWidth, totalGridHeight);

    const gridStartX = 0;
    const gridStartY = 0;

    const totalSlots = numCols * numRows;

    // ─── MONTAGEM DO MOSAICO ────────────────────────────────────────────────
    for (let index = 0; index < totalSlots; index++) {
      const col = index % numCols;
      const row = Math.floor(index / numCols);

      const posX = gridStartX + (col * spriteWidth);
      const posY = gridStartY + (row * spriteHeight);

      if (index < totalImagens) {
        const variant = ownedVariants[index];
        const spritePath = path.join(IMAGES_BASE, 'elementais', path.basename(variant.image));

        if (fs.existsSync(spritePath)) {
          const spriteImg = await Jimp.read(spritePath);
          spriteImg.resize(spriteWidth, spriteHeight);

          spriteImg.scan(0, 0, spriteWidth, borderThickness, function (x, y, idx) {
            this.bitmap.data.writeUInt32BE(borderColor, idx);
          });
          spriteImg.scan(0, spriteHeight - borderThickness, spriteWidth, borderThickness, function (x, y, idx) {
            this.bitmap.data.writeUInt32BE(borderColor, idx);
          });
          spriteImg.scan(0, 0, borderThickness, spriteHeight, function (x, y, idx) {
            this.bitmap.data.writeUInt32BE(borderColor, idx);
          });
          spriteImg.scan(spriteWidth - borderThickness, 0, borderThickness, spriteHeight, function (x, y, idx) {
            this.bitmap.data.writeUInt32BE(borderColor, idx);
          });

          if (posX + spriteWidth <= baseImage.bitmap.width && posY + spriteHeight <= baseImage.bitmap.height) {
            baseImage.composite(spriteImg, posX, posY, {
              mode: Jimp.BLEND_SOURCE_OVER,
              opacitySource: 1,
              opacityTarget: 1
            });
          }
        } else {
          console.warn(`[JIMP WARN] Imagem não encontrada para compor mosaico: ${spritePath}`);
        }
      } else {
        const emptySlot = new Jimp(spriteWidth, spriteHeight, 0x00000000);
        baseImage.composite(emptySlot, posX, posY, {
          mode: Jimp.BLEND_DST_OVER,
          opacitySource: 1,
          opacityTarget: 1
        });
      }
    }

    await baseImage.writeAsync(outputPath);
    return outputPath;

  } catch (error) {
    console.error('[JIMP ERROR] Falha ao gerar mosaico:', error.message);
    throw error;
  }
}

// ─── Rotina de Geração do Mosaico dos Faltantes (Jimp) ─────────────────────────

async function generateMissingMosaic(userId) {
  try {
    const [ownedVariantIds, allVariants] = await Promise.all([
      getUserCollectionIds(userId),
      getAllVariants()
    ]);

    const baseBackgroundPath = path.join(IMAGES_BASE, 'background/bg-v.png');
    const outputDir = path.join(IMAGES_BASE, 'elementais/temp_mosaics');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `missing_${userId}.png`);
    const baseImage = await Jimp.read(baseBackgroundPath);

    // Filtra apenas o que NÃO é da coleção E está ativo no banco
    const missingVariants = allVariants.filter(v =>
      !ownedVariantIds.has(v.id_elemental_variant) &&
      v.is_active === 1 && 
      v.image
    );
    const totalImagens = missingVariants.length;

    if (totalImagens === 0) {
      await baseImage.writeAsync(outputPath);
      return outputPath;
    }

    // ─── DEFINIÇÃO DO TAMANHO FIXO DO SPRITE ────────────────────────────────
    const spriteWidth = 256;
    const propCard = 1024 / 1536;
    const spriteHeight = Math.round(spriteWidth / propCard); 

    const borderThickness = 2;
    const borderColor = 0x00000044;

    const aspectoImagem = spriteHeight / spriteWidth; 

    const numCols = Math.max(1, Math.round(Math.sqrt(totalImagens * aspectoImagem)));
    const numRows = Math.ceil(totalImagens / numCols);

    const totalGridWidth = numCols * spriteWidth;
    const totalGridHeight = numRows * spriteHeight;

    baseImage.resize(totalGridWidth, totalGridHeight);

    const gridStartX = 0;
    const gridStartY = 0;

    const totalSlots = numCols * numRows;

    // ─── MONTAGEM DO MOSAICO ────────────────────────────────────────────────
    for (let index = 0; index < totalSlots; index++) {
      const col = index % numCols;
      const row = Math.floor(index / numCols);

      const posX = gridStartX + (col * spriteWidth);
      const posY = gridStartY + (row * spriteHeight);

      if (index < totalImagens) {
        const variant = missingVariants[index];
        const spritePath = path.join(IMAGES_BASE, 'elementais', path.basename(variant.image));

        if (fs.existsSync(spritePath)) {
          const spriteImg = await Jimp.read(spritePath);
          spriteImg.resize(spriteWidth, spriteHeight);

          spriteImg.scan(0, 0, spriteWidth, borderThickness, function (x, y, idx) { this.bitmap.data.writeUInt32BE(borderColor, idx); });
          spriteImg.scan(0, spriteHeight - borderThickness, spriteWidth, borderThickness, function (x, y, idx) { this.bitmap.data.writeUInt32BE(borderColor, idx); });
          spriteImg.scan(0, 0, borderThickness, spriteHeight, function (x, y, idx) { this.bitmap.data.writeUInt32BE(borderColor, idx); });
          spriteImg.scan(spriteWidth - borderThickness, 0, borderThickness, spriteHeight, function (x, y, idx) { this.bitmap.data.writeUInt32BE(borderColor, idx); });

          if (posX + spriteWidth <= baseImage.bitmap.width && posY + spriteHeight <= baseImage.bitmap.height) {
            baseImage.composite(spriteImg, posX, posY, { mode: Jimp.BLEND_SOURCE_OVER, opacitySource: 1, opacityTarget: 1 });
          }
        } else {
          console.warn(`[JIMP WARN] Imagem não encontrada para compor mosaico de faltantes: ${spritePath}`);
        }
      } else {
        const emptySlot = new Jimp(spriteWidth, spriteHeight, 0x00000000);
        baseImage.composite(emptySlot, posX, posY, {
          mode: Jimp.BLEND_DST_OVER,
          opacitySource: 1,
          opacityTarget: 1
        });
      }
    }

    await baseImage.writeAsync(outputPath);
    return outputPath;

  } catch (error) {
    console.error('[JIMP ERROR] Falha ao gerar mosaico de faltantes:', error.message);
    throw error;
  }
}

// ─── Tela: Menu de Configurações do usuário ──────────────────────────────────

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
      [{ text: '🖼️ Gerar imagem da coleção', callback_data: 'el_gerar_imagem' }],
      [{ text: '🗑️ Fechar', callback_data: 'el_close' }]
    ],
  };

  if (isEdit) {
    return ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }
  return ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
}

// ─── Tela: Menu de Categorias ─────────────────────────────────────────────────

async function sendCategoryMenu(ctx, isEdit) {
  const categories = await getElementalCategories();

  if (categories.length === 0) {
    const msg = '❌ Nenhuma categoria disponível no momento.';
    return isEdit ? ctx.editMessageText(msg) : ctx.reply(msg);
  }

  const text =
    '🌟 <b>Sprites Elementais</b>\n\n' +
    'Escolha uma categoria para explorar:';

  // Mapeia os botões das categorias
  const inline_keyboard = categories.map(c => ([{
    text: `${catEmoji(c.code)} ${c.name}`,
    callback_data: `el_cat_${c.id_elemental_category}`,
  }]));

  // Insere os botões de ação e navegação no final da lista
  inline_keyboard.push([{ text: '🖼️ Gerar imagem da coleção', callback_data: 'el_gerar_imagem' }]);
  
  // Botões de Voltar aos Modos e Fechar
  inline_keyboard.push([
    { text: '🔙 Voltar aos Modos', callback_data: 'el_mode_select' },
    { text: '🗑️ Fechar', callback_data: 'el_close' }
  ]);

  const keyboard = { inline_keyboard };

  if (isEdit) {
    return ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }
  return ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
}

// Função para dividir o array de botões em colunas
function chunkButtons(buttonsArray, columns = 2) {
  const result = [];
  for (let i = 0; i < buttonsArray.length; i += columns) {
    result.push(buttonsArray.slice(i, i + columns));
  }
  return result;
}

// ─── Tela: Lista de Sprites de uma categoria ──────────────────────────────────

async function sendSpriteList(ctx, categoryId, isEdit, userId) {
  const [categories, variants] = await Promise.all([
    getElementalCategories(),
    getVariantsByCategory(categoryId),
  ]);

  const category = categories.find(c => c.id_elemental_category == categoryId);

  if (!category) {
    const msg = '❌ Categoria não encontrada.';
    const kb = { inline_keyboard: [[{ text: '⬅️ Categorias', callback_data: 'el_back_cat' }]] };
    return isEdit ? ctx.editMessageText(msg, { reply_markup: kb }) : ctx.reply(msg, { reply_markup: kb });
  }

  // Busca os IDs da coleção e os IDs já dominados
  const ownedIds = userId ? await getUserCollectionIds(userId) : new Set();
  const dominatedIds = userId ? await getUserDominatedIds(userId) : new Set();

  const emoji = catEmoji(category.code);
  const owned = variants.filter(v => ownedIds.has(v.id_elemental_variant)).length;

  const text =
    `${emoji} <b>${category.name}</b>\n` +
    `<i>${variants.length} sprite(s) — ${owned} na sua coleção</i>\n\n` +
    'Toque no nome para ver a ficha, no ✅ para colecionar, ou na 👑 para dominar:';

  // Monta a grade com 3 botões por linha
  const spriteButtons = variants.map(v => {
    const has = ownedIds.has(v.id_elemental_variant);
    const checkIcon = has ? '✅' : '☑️';
    const isDominated = dominatedIds.has(v.id_elemental_variant);
    const domIcon = has ? '👑' : '➖';

    const domButton = {
      text: domIcon,
      callback_data: `el_dom_${v.id_elemental_variant}_${categoryId}`
    };

    if (isDominated) {
      domButton.style = 'primary';
    }

    return [
      {
        text: v.sprite_name,
        callback_data: `el_var_${v.id_elemental_variant}` 
      },
      {
        text: checkIcon,
        callback_data: `el_chk_${v.id_elemental_variant}_${categoryId}` 
      },
      domButton 
    ];
  });

  spriteButtons.push([{ text: '🖼️ Gerar imagem da coleção', callback_data: 'el_gerar_imagem' }]);
  
  // Botões de Voltar e Fechar na Lista de Categoria
  spriteButtons.push([
    { text: '⬅️ Categorias', callback_data: 'el_back_cat' },
    { text: '🗑️ Fechar', callback_data: 'el_close' }
  ]);

  const keyboard = { inline_keyboard: spriteButtons };

  if (isEdit) {
    return ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }
  return ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
}

module.exports = {
  IMAGES_BASE,
  catEmoji,
  buildVariantCaption,
  buildProgressBar,
  generateCollectionMosaic,
  generateMissingMosaic,
  sendConfigMenu,
  sendCategoryMenu,
  sendSpriteList,
  chunkButtons
};