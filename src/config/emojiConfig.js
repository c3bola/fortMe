'use strict';

/**
 * Mapeamento central de Emojis com suporte a Telegram Premium (tg-emoji)
 * Para utilizar emojis customizados premium, preencha o campo id correspondente.
 * Se id for null ou vazio, o bot enviará o emoji Unicode padrão (fallback).
 */
const EMOJIS = {
  // Medalhas do /jardim
  platinum: { fallback: '🏆', id: null },
  gold:     { fallback: '🥇', id: null },
  silver:   { fallback: '🥈', id: null },
  bronze:   { fallback: '🥉', id: null },
  default:  { fallback: '🏅', id: null },

  // Categorias de Elementais
  basic:    { fallback: '⚪', id: null },
  candy:    { fallback: '🍬', id: null },
  goldCat:  { fallback: '🟡', id: null },
  galaxy:   { fallback: '🌌', id: null },
  gem:      { fallback: '💎', id: null },
  holofoil: { fallback: '✨', id: null },
  cube:     { fallback: '🟣', id: null },
  special:  { fallback: '⭐', id: null },

  // Elementos de UI
  shield:   { fallback: '🛡️', id: null },
  crown:    { fallback: '👑', id: null },
  sparkles: { fallback: '✨', id: null },
  box:      { fallback: '📦', id: null }
};

/**
 * Retorna o emoji formatado para uso em mensagens com parse_mode: 'HTML'
 * @param {string} key - Chave do emoji (ex: 'platinum', 'gold', 'galaxy')
 * @returns {string}
 */
function getEmoji(key) {
  const emoji = EMOJIS[key];
  if (!emoji) return '🔹';
  
  if (emoji.id) {
    return `<tg-emoji emoji-id="${emoji.id}">${emoji.fallback}</tg-emoji>`;
  }
  return emoji.fallback;
}

module.exports = {
  EMOJIS,
  getEmoji
};