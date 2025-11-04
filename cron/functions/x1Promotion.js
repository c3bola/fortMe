const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

// Frases promocionais para X1
const x1PromotionalPhrases = [
  "⚔️ <b>Hora do X1!</b> ⚔️\n\nJá mandou seu X1 hoje? Desafie alguém com /x1 e prove que você não é embananado! 🍌\n\n💥 <i>Responda a mensagem de alguém e digite /x1!</i>",
  "🔥 <b>Cadê a coragem?</b> 🔥\n\nO dia tá passando e ninguém duelou ainda! Use /x1 para mostrar quem manda no grupo! 👑\n\n⚡ <i>X1 é coisa de macho raiz!</i>",
  "🎯 <b>Duelo Real!</b> 🎯\n\nCansei de ver só papo furado! Vamos ver quem tem peito para um X1 de verdade! 💪\n\n🚀 <i>Digite /x1 respondendo a mensagem de alguém!</i>",
  "⚡ <b>Desafio Aceito?</b> ⚡\n\nTá todo mundo muito quieto aqui... Será que ninguém tem coragem de chamar para o X1? 🐔\n\n🔥 <i>Use /x1 e mostre sua garra!</i>",
  "💀 <b>Arena Vazia!</b> 💀\n\nA arena tá vazia! Cadê os guerreiros para um duelo épico? 🗡️\n\n✨ <i>Responda alguém e mande /x1 para começar a zueira!</i>",
  "🌟 <b>Batalha Real!</b> 🌟\n\nVocês ficam só falando de skin e V-Bucks... Cadê a ação? Vamos de X1! ⚔️\n\n🎮 <i>O comando é /x1 respondendo a mensagem!</i>",
  "🏆 <b>Campeão do Dia!</b> 🏆\n\nAlguém vai virar o rei dos duelos hoje! Será que você tem coragem de tentar? 👑\n\n🚀 <i>Mande /x1 e entre para o ranking!</i>",
  "💥 <b>Tá com Medo?</b> 💥\n\nO grupo tá muito parado... Será que todo mundo tá com medo de perder no X1? 😏\n\n⚔️ <i>Prove o contrário! Use /x1!</i>",
  "🎪 <b>Showtime!</b> 🎪\n\nVamos animar esse grupo! Quem quer ver um duelo de respeito? 🥊\n\n🔥 <i>Desafie alguém com /x1 e vamos rir juntos!</i>",
  "🚀 <b>Para a Batalha!</b> 🚀\n\nO dia tá pedindo um X1 maroto! Quem vai dar o primeiro passo? 👣\n\n⚡ <i>Responda alguém e digite /x1!</i>"
];

module.exports = async (bot) => {
  console.log('[INFO] Executando promoção de X1...');

  try {
    // Filtrar grupos ativos do arquivo de configuração
    const activeGroups = config.groups ? config.groups.filter(group => group.status) : [];

    if (activeGroups.length === 0) {
      console.log('[INFO] Nenhum grupo ativo encontrado para promoção de X1.');
      return;
    }

    // Escolher uma frase aleatória
    const randomPhrase = x1PromotionalPhrases[Math.floor(Math.random() * x1PromotionalPhrases.length)];

    // Enviar mensagem para todos os grupos ativos
    for (const group of activeGroups) {
      try {
        console.log(`[INFO] Enviando promoção de X1 para o grupo ${group.id} (${group.name})...`);
        
        await bot.telegram.sendMessage(group.id, randomPhrase, {
          parse_mode: 'HTML'
        });

        console.log(`[INFO] Promoção de X1 enviada com sucesso para ${group.name}`);
        
        // Pequeno delay entre envios para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`[ERROR] Falha ao enviar promoção de X1 para o grupo ${group.name} (${group.id}):`, error.message);
      }
    }

    console.log('[INFO] Promoção de X1 concluída para todos os grupos ativos.');
    
  } catch (error) {
    console.error('[ERROR] Erro geral na promoção de X1:', error.message);
    throw error;
  }
};