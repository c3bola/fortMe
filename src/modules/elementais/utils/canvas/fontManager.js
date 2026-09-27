'use strict';

const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const SRC_DIR = path.join(__dirname, '../../../../');
const FONTS_DIR = path.join(SRC_DIR, 'assets/fonts/burbark');

const LoadedFonts = {};
const FONT_SIZES = [200, 180, 160, 140, 120, 100, 90, 64, 52, 50, 48, 34, 32, 20, 16];

async function loadAllFonts() {
  if (Object.keys(LoadedFonts).length > 0) return;

  let loadedCount = 0;
  for (const size of FONT_SIZES) {
    const fontPath = path.join(FONTS_DIR, `burbark_${size}.fnt`);
    if (fs.existsSync(fontPath)) {
      try {
        LoadedFonts[size] = await Jimp.loadFont(fontPath);
        loadedCount++;
      } catch (err) {
        console.warn(`[JIMP] Falha ao carregar fonte ${fontPath}:`, err.message);
      }
    }
  }

  if (loadedCount === 0) {
    console.warn(`[AVISO] Nenhuma fonte bitmap encontrada em ${FONTS_DIR}. Carregando fonte padrão.`);
    const defaultFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    for (const size of FONT_SIZES) {
      LoadedFonts[size] = defaultFont;
    }
  }
}

function getBestFont(text, maxWidth) {
  for (const size of FONT_SIZES) {
    const font = LoadedFonts[size];
    if (!font) continue;
    const width = Jimp.measureText(font, text);
    if (width <= maxWidth) return font;
  }
  return LoadedFonts[16] || Object.values(LoadedFonts)[0];
}

function getFontBySize(sizeFallback) {
  return LoadedFonts[sizeFallback] || Object.values(LoadedFonts)[0];
}

module.exports = {
  loadAllFonts,
  getBestFont,
  getFontBySize
};