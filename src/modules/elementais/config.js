'use strict';

const path = require('path');

// Caminho base para a pasta de imagens
const IMAGES_BASE = path.join(__dirname, '../../assets/images/');

// Mapeamento de Emojis (Preencha o 'id' com o ID do emoji Premium, se desejar)
const EMOJIS = {
  // Medalhas
  platinum: { fallback: '🏆', id: null },
  gold:     { fallback: '🥇', id: null },
  silver:   { fallback: '🥈', id: null },
  bronze:   { fallback: '🥉', id: null },
  default:  { fallback: '🏅', id: null },

  // Categorias
  basic:    { fallback: '⚪', id: null },
  candy:    { fallback: '🍬', id: null },
  goldCat:  { fallback: '🟡', id: null },
  galaxy:   { fallback: '🌌', id: null },
  gem:      { fallback: '💎', id: null },
  holofoil: { fallback: '✨', id: null },
  cube:     { fallback: '🟣', id: null },
  special:  { fallback: '⭐', id: null },

  // UI
  shield:   { fallback: '🛡️', id: null },
  crown:    { fallback: '👑', id: null },
  box:      { fallback: '📦', id: null }
};

function getEmoji(key) {
  const emoji = EMOJIS[key];
  if (!emoji) return '🔹';
  if (emoji.id) {
    return `<tg-emoji emoji-id="${emoji.id}">${emoji.fallback}</tg-emoji>`;
  }
  return emoji.fallback;
}

// Cores Hexadecimais (RGBA) para o efeito Glow do Jimp
const CATEGORY_COLORS = {
  'basic': 0xFFFFFFFF,      // Branco
  'gold': 0xFFD700FF,       // Dourado
  'candy': 0xFFC0CBFF,      // Rosa
  'galaxy': 0x8A2BE2FF,     // Roxo
  'gem': 0x00FFFFFF,        // Ciano
  'holofoil': 0xE0FFFFFF,   // Prata/Holo
  'cube': 0x9932CCFF,       // Roxo Escuro
  'special': 0xFFA500FF     // Laranja
};

module.exports = {
  IMAGES_BASE,
  EMOJIS,
  getEmoji,
  CATEGORY_COLORS
};