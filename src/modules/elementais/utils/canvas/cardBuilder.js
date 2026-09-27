'use strict';

const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const { CATEGORY_COLORS } = require('../../config');
const fontManager = require('./fontManager');

const SRC_DIR = path.join(__dirname, '../../../../');
const IMAGES_BASE = path.join(SRC_DIR, 'assets/images');

// ─── HELPER PARA DEFINIR O FUNDO (DINÂMICO) ──────────────────────────────────
function resolveBgFile(rawCode) {
  if (!rawCode) return 'basico.png';
  return `${rawCode.toLowerCase().trim()}.png`;
}

async function buildCard(variantName, categoryCode, categoryName, sourceFilename, includeBackground = false) {
  await fontManager.loadAllFonts();

  const sourcePath = path.join(IMAGES_BASE, 'sprite_original', sourceFilename);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Imagem original não encontrada: ${sourcePath}`);
  }

  const CARD_WIDTH = 1024;
  const CARD_HEIGHT = 1536;
  
  const finalImage = new Jimp(CARD_WIDTH, CARD_HEIGHT, 0x00000000);

  if (includeBackground) {
    const bgFileName = resolveBgFile(categoryCode);
    let bgPath = path.join(IMAGES_BASE, 'background', bgFileName);
    
    // Fallback inteligente: se a imagem da categoria não existir, usa a basico.png
    if (!fs.existsSync(bgPath)) {
      bgPath = path.join(IMAGES_BASE, 'background', 'basico.png');
    }

    if (fs.existsSync(bgPath)) {
      const bgImg = await Jimp.read(bgPath);
      bgImg.cover(CARD_WIDTH, CARD_HEIGHT);
      finalImage.composite(bgImg, 0, 0);
    }
  }

  // 2. Prepara e aplica o Sprite Original
  const spriteOriginal = await Jimp.read(sourcePath);
  const targetSpriteSize = 1300;
  spriteOriginal.resize(targetSpriteSize, targetSpriteSize);

  const glowHexColor = CATEGORY_COLORS[categoryCode] || 0xFFFFFFFF;
  const glowImg = spriteOriginal.clone();
  try { glowImg.color([{ apply: 'xor', params: [glowHexColor] }]); } catch (e) { }

  const nameText = (variantName || '').toUpperCase();
  const fontName = fontManager.getBestFont(nameText, CARD_WIDTH * 0.85);
  const textWidth = Jimp.measureText(fontName, nameText);
  const nameX = (CARD_WIDTH - textWidth) / 2;
  const nameY = 80;

  const catText = (categoryName || '').toUpperCase();
  const fontCat = fontManager.getFontBySize(64) || fontManager.getFontBySize(52);
  const catTextWidth = Jimp.measureText(fontCat, catText);
  const catTextHeight = Jimp.measureTextHeight(fontCat, catText, CARD_WIDTH);
  const catX = (CARD_WIDTH - catTextWidth) / 2;
  const nameHeight = Jimp.measureTextHeight(fontName, nameText, CARD_WIDTH);
  const catY = nameY + nameHeight + 12;

  const lineY = catY + Math.round(catTextHeight / 2);
  const lineLength = 120;
  const gap = 35;

  const posX = (CARD_WIDTH - targetSpriteSize) / 2;
  const posY = Math.max(260, (CARD_HEIGHT - targetSpriteSize) / 2 + 50);

  // 3. Aplica os efeitos de Glow e linhas decorativas
  const glowSombra = glowImg.clone().opacity(0.35);
  finalImage.composite(glowSombra, posX - 6, posY - 6);

  const startLeftX = Math.round(catX - gap - lineLength);
  for (let lx = startLeftX; lx < startLeftX + lineLength; lx++) {
    if (lx >= 0 && lx < CARD_WIDTH) {
      finalImage.setPixelColor(glowHexColor, lx, Math.round(lineY));
      finalImage.setPixelColor(glowHexColor, lx, Math.round(lineY + 1));
    }
  }

  const startRightX = Math.round(catX + catTextWidth + gap);
  for (let rx = startRightX; rx < startRightX + lineLength; rx++) {
    if (rx < CARD_WIDTH) {
      finalImage.setPixelColor(glowHexColor, rx, Math.round(lineY));
      finalImage.setPixelColor(glowHexColor, rx, Math.round(lineY + 1));
    }
  }

  // 4. Compõe os elementos finais (Sprite e Textos)
  finalImage.composite(spriteOriginal, posX, posY);
  finalImage.print(fontName, nameX, nameY, nameText);
  finalImage.print(fontCat, catX, catY, catText);

  return finalImage;
}

module.exports = { buildCard };