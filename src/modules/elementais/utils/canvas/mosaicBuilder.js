'use strict';

const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const fontManager = require('./fontManager');

const SRC_DIR = path.join(__dirname, '../../../../');
const IMAGES_BASE = path.join(SRC_DIR, 'assets/images');
const UI_BASE = path.join(IMAGES_BASE, 'ui');
const BG_BASE = path.join(IMAGES_BASE, 'background');
const SPRITES_BASE = path.join(IMAGES_BASE, 'sprite_original');

// ─── LEITURA DINÂMICA DAS CONFIGURAÇÕES ──────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, '../../config/mosaicConfig.json');

function getMosaicConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Erro ao ler mosaicConfig.json, usando defaults.', e);
  }
  
  // Retorna os valores padrão como fallback de segurança
  return {
    escurecimentoFundoGeral: 5, 
    escurecimentoBloqueados: 12, 
    escalaFinal: 0.40,
    escalaSprite: 0.85,
    margemExterna: 50,
    espacoEntreItens: 12,
    espacoEntreLinhas: 35,
    espacoEntreLinhasGrid: 15,
    alturaNomes: 45,
    MAX_COLS: 8
  };
}

// ─── MAPEAMENTO DE CORES DO TILESET ──────────────────────────────────────────
const COORDS = {
  AZUL: { card: { x: 0, y: 283, largura: 501, altura: 527 }, header: { x: 0, y: 0, largura: 501, altura: 283 } },
  LARANJA: { card: { x: 503, y: 283, largura: 501, altura: 527 }, header: { x: 503, y: 0, largura: 501, altura: 283 } },
  VERDE: { card: { x: 1006, y: 283, largura: 501, altura: 527 }, header: { x: 1006, y: 0, largura: 501, altura: 283 } }
};

function getCoords(code) {
  const c = (code || '').toLowerCase();
  if (['dourado', 'gold'].some(k => c.includes(k))) return COORDS.LARANJA;
  if (['trapaceiro', 'candy', 'special'].some(k => c.includes(k))) return COORDS.VERDE;
  return COORDS.AZUL;
}

// ─── CONSTRUÇÃO DO MOSAICO ───────────────────────────────────────────────────
async function buildUnifiedMosaic(bandLayouts) {
  const CONFIG = getMosaicConfig(); // 🔥 Lê as configurações atualizadas aqui!

  await fontManager.loadAllFonts();

  const tilesetPath = path.join(UI_BASE, 'tileset', 'categorias.png');
  const cadeadoPath = path.join(UI_BASE, 'lock.png');

  const tileset = await Jimp.read(tilesetPath);
  let cadeadoImg = null;
  if (fs.existsSync(cadeadoPath)) {
    cadeadoImg = await Jimp.read(cadeadoPath);
    cadeadoImg.scaleToFit(32, 32);
  }

  const fontNomeCard = fontManager.getFontBySize(34);
  const fontCatTitulo = fontManager.getFontBySize(50);

  // Cálculos Base de Dimensão
  const headerTeste = tileset.clone().crop(0, 0, 501, 283).scale(CONFIG.escalaFinal);
  const cardTeste = tileset.clone().crop(0, 283, 501, 527).scale(CONFIG.escalaFinal);
  const alturaElemento = Math.max(headerTeste.bitmap.height, cardTeste.bitmap.height) + CONFIG.alturaNomes;

  let totalAltura = CONFIG.margemExterna * 2;
  let maxColsEncontradas = 0;

  for (const band of bandLayouts) {
    band.linhasGrid = Math.ceil(band.items.length / CONFIG.MAX_COLS) || 1;
    
    // Calcula a altura total deste bloco de categoria (incluindo quebras de linha internas)
    band.alturaBandaTotal = (band.linhasGrid * alturaElemento) + ((band.linhasGrid - 1) * CONFIG.espacoEntreLinhasGrid);
    totalAltura += band.alturaBandaTotal + CONFIG.espacoEntreLinhas;
    
    const colsNestaBanda = Math.min(band.items.length, CONFIG.MAX_COLS);
    if (colsNestaBanda > maxColsEncontradas) maxColsEncontradas = colsNestaBanda;
  }
  totalAltura -= CONFIG.espacoEntreLinhas; // Remove sobra final

  const larguraConteudoMax = headerTeste.bitmap.width + (CONFIG.espacoEntreItens * 2) +
                             (maxColsEncontradas * cardTeste.bitmap.width) +
                             (Math.max(0, maxColsEncontradas - 1) * CONFIG.espacoEntreItens);

  const larguraTotal = CONFIG.margemExterna + larguraConteudoMax + CONFIG.margemExterna;

  const mosaico = new Jimp(larguraTotal, totalAltura, 0x00000000);

  // Fundo Global Sideral
  let globalBgPath = path.join(BG_BASE, 'bg-h.png');
  if (!fs.existsSync(globalBgPath)) globalBgPath = path.join(BG_BASE, 'basico.png');

  if (fs.existsSync(globalBgPath)) {
    const globalBg = await Jimp.read(globalBgPath);
    globalBg.cover(larguraTotal, totalAltura);
    if (CONFIG.escurecimentoFundoGeral > 0) {
      globalBg.color([{ apply: 'darken', params: [CONFIG.escurecimentoFundoGeral] }]);
    }
    mosaico.composite(globalBg, 0, 0);
  }

  // Processamento de Linhas e Sprites
  let yAtual = CONFIG.margemExterna;

  for (const band of bandLayouts) {
    const coords = getCoords(band.code);

    // ─── CENTRALIZAÇÃO DO HEADER ───
    // Ancorado exatamente no centro vertical do bloco total da categoria
    const baseYHeader = yAtual + (band.alturaBandaTotal - headerTeste.bitmap.height) / 2;
    
    let headerMoldura = tileset.clone().crop(coords.header.x, coords.header.y, coords.header.largura, coords.header.altura).scale(CONFIG.escalaFinal);
    mosaico.composite(headerMoldura, CONFIG.margemExterna, baseYHeader);

    const headerX = CONFIG.margemExterna;
    const headerW = headerMoldura.bitmap.width;
    const catTexto = (band.name || '').toUpperCase();
    const catWidth = Jimp.measureText(fontCatTitulo, catTexto);

    mosaico.print(fontCatTitulo, headerX + (headerW - catWidth) / 2, baseYHeader + 35, catTexto);

    const shieldPath = path.join(UI_BASE, `shield_${(band.code || '').toLowerCase()}.png`);
    if (fs.existsSync(shieldPath)) {
      const shield = await Jimp.read(shieldPath);
      shield.scaleToFit(40, 40);
      mosaico.composite(shield, headerX + (headerW - shield.bitmap.width) / 2, baseYHeader + 85);
    }

    // ─── RENDERIZAÇÃO DOS CARDS ───
    const startXCards = CONFIG.margemExterna + headerMoldura.bitmap.width + (CONFIG.espacoEntreItens * 2);

    for (let idx = 0; idx < band.items.length; idx++) {
      const item = band.items[idx];
      const col = idx % CONFIG.MAX_COLS;
      const row = Math.floor(idx / CONFIG.MAX_COLS);

      const posicaoXAtual = startXCards + (col * (cardTeste.bitmap.width + CONFIG.espacoEntreItens));
      const posicaoYAtual = yAtual + (row * (alturaElemento + CONFIG.espacoEntreLinhasGrid)) + CONFIG.alturaNomes;

      let cardMoldura = tileset.clone().crop(coords.card.x, coords.card.y, coords.card.largura, coords.card.altura).scale(CONFIG.escalaFinal);

      const hasVariant = item.hasVariant !== false; 
      const originalFileName = path.basename(item.image || `${item.slug}_${item.category_code}.png`);

      let spritePath = path.join(SPRITES_BASE, originalFileName);
      if (!fs.existsSync(spritePath)) spritePath = path.join(IMAGES_BASE, 'elementais', originalFileName);

      if (fs.existsSync(spritePath)) {
        let sprite = await Jimp.read(spritePath);
        sprite.scaleToFit(cardMoldura.bitmap.width * CONFIG.escalaSprite, cardMoldura.bitmap.height * CONFIG.escalaSprite);

        if (!hasVariant) {
          sprite.greyscale();
          if (CONFIG.escurecimentoBloqueados > 0) sprite.color([{ apply: 'darken', params: [CONFIG.escurecimentoBloqueados] }]);
        }

        const spriteX = (cardMoldura.bitmap.width - sprite.bitmap.width) / 2;
        const spriteY = (cardMoldura.bitmap.height - sprite.bitmap.height) / 2;
        cardMoldura.composite(sprite, spriteX, spriteY);

        // ─── CADEADO COM FUNDO FUMÊ ───
        if (!hasVariant && cadeadoImg) {
          const lockW = 36;
          const lockH = 26;
          let lockBg = new Jimp(lockW, lockH, 0x000000AA);

          let tempLock = cadeadoImg.clone().scaleToFit(18, 18);
          lockBg.composite(tempLock, (lockW - tempLock.bitmap.width) / 2, (lockH - tempLock.bitmap.height) / 2);

          cardMoldura.composite(lockBg, (cardMoldura.bitmap.width - lockW) / 2, cardMoldura.bitmap.height - lockH - 12);
        }
      }

      mosaico.composite(cardMoldura, posicaoXAtual, posicaoYAtual);

      const nomeItem = (item.sprite_name || '').toUpperCase();
      const larguraTexto = Jimp.measureText(fontNomeCard, nomeItem);
      mosaico.print(fontNomeCard, posicaoXAtual + (cardMoldura.bitmap.width - larguraTexto) / 2, posicaoYAtual - 35, nomeItem);
    }

    // Avança o Y para a próxima categoria
    yAtual += band.alturaBandaTotal + CONFIG.espacoEntreLinhas;
  }

  return mosaico;
}

// Intercepta as chamadas legadas e as redireciona para a nova renderização unificada
module.exports = {
  buildGridMosaic: async (band) => await buildUnifiedMosaic([band]),
  buildBandMosaic: async (bandLayouts) => await buildUnifiedMosaic(bandLayouts)
};