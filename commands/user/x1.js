const fs = require('fs');
const path = require('path');

// Armazenar duelos ativos em memória
const activeDuels = new Map();

// Caminho para o banco de dados de ranking diário
const dailyRankingPath = path.join(__dirname, '../../database/dailyx1.json');

// Tempo limite para duelos (30 minutos)
const DUEL_TIMEOUT = 30 * 60 * 1000;

// Frases para quando alguém joga sozinho
const soloLosePhrases = [
  "<a href='tg://user?id={userId}'>{username}</a> entrou no X1 sozinho e perdeu pra própria sombra. 👻",
  "<a href='tg://user?id={userId}'>{username}</a> tentou jogar contra o vento... e perdeu feio. 💨",
  "<a href='tg://user?id={userId}'>{username}</a> desafiou o próprio reflexo no espelho e saiu chorando. 😭",
  "<a href='tg://user?id={userId}'>{username}</a> jogou X1 contra a imaginação e tomou uma surra épica. 🤡",
  "<a href='tg://user?id={userId}'>{username}</a> tentou duelar com sua própria sombra... A sombra ganhou. 🌚",
  "<a href='tg://user?id={userId}'>{username}</a> fez um X1 solo tão ruim que até o Luigi riu. 😂",
  "<a href='tg://user?id={userId}'>{username}</a> desafiou o ar e mesmo assim perdeu. Que vergonha! 🌬️",
  "<a href='tg://user?id={userId}'>{username}</a> tentou jogar contra ninguém e perdeu para todo mundo. 🤦‍♂️",
  "<a href='tg://user?id={userId}'>{username}</a> fez um duelo tão solitário que até os bots fugiram. 🤖",
  "<a href='tg://user?id={userId}'>{username}</a> jogou X1 sozinho e perdeu para o próprio dedo mindinho. 👶"
];

// Frases para abandono de duelos
const abandonmentPhrases = {
  singleAbandon: [
    "<a href='tg://user?id={waiterId}'>{waiterName}</a> esperou <a href='tg://user?id={abandonerId}'>{abandonerName}</a> por 30 minutos... e ele fugiu! 🏃‍♂️",
    "<a href='tg://user?id={waiterId}'>{waiterName}</a> ficou plantado esperando <a href='tg://user?id={abandonerId}'>{abandonerName}</a> que sumiu no mundo! 🌍",
    "<a href='tg://user?id={abandonerId}'>{abandonerName}</a> deixou <a href='tg://user?id={waiterId}'>{waiterName}</a> falando sozinho por 30 minutos. Que vacilo! 😤",
    "<a href='tg://user?id={waiterId}'>{waiterName}</a> esperou tanto <a href='tg://user?id={abandonerId}'>{abandonerName}</a> que criou barba! 🧔",
    "<a href='tg://user?id={abandonerId}'>{abandonerName}</a> fugiu mais rápido que ladrão de galinha. <a href='tg://user?id={waiterId}'>{waiterName}</a> venceu por W.O.! 🐓"
  ],
  doubleAbandon: [
    "O X1 foi tão parado que virou sessão de meditação. 🧘‍♂️",
    "Ambos esqueceram do X1. A paz venceu. ☮️",
    "O duelo foi tão zen que ninguém apareceu para brigar. 🕯️",
    "Parece que os dois foram tomar um café e esqueceram do X1. ☕",
    "O X1 mais silencioso da história. Até o crickets pararam de fazer barulho. 🦗",
    "Um duelo tão fantasma que nem os fantasmas apareceram. 👻",
    "O X1 virou hide and seek, mas ninguém procurou ninguém. 🙈",
    "Esse foi o X1 mais pacífico da história. Gandhi ficaria orgulhoso. ✌️"
  ]
};

// Frases para resultados de duelos
const duelResults = {
  attack_vs_flee: [
    "⚔️ <a href='tg://user?id={winnerId}'>{winnerName}</a> atacou com fúria enquanto <a href='tg://user?id={loserId}'>{loserName}</a> tentou fugir como um covarde! 🏃‍♂️💨",
    "⚔️ <a href='tg://user?id={winnerId}'>{winnerName}</a> foi implacável no ataque! <a href='tg://user?id={loserId}'>{loserName}</a> fugiu mais rápido que skin grátis! 🎯",
    "⚔️ <a href='tg://user?id={winnerId}'>{winnerName}</a> dominou o campo de batalha! <a href='tg://user?id={loserId}'>{loserName}</a> correu que nem frango assado! 🐔"
  ],
  defend_vs_attack: [
    "🛡️ <a href='tg://user?id={winnerId}'>{winnerName}</a> defendeu como um muro de metal! <a href='tg://user?id={loserId}'>{loserName}</a> se quebrou todo no ataque! 🧱",
    "🛡️ <a href='tg://user?id={winnerId}'>{winnerName}</a> bloqueou tudo! <a href='tg://user?id={loserId}'>{loserName}</a> bateu que nem mosca no vidro! 🪰",
    "🛡️ <a href='tg://user?id={winnerId}'>{winnerName}</a> foi uma fortaleza impenetrável! <a href='tg://user?id={loserId}'>{loserName}</a> se machucou atacando! 🏰"
  ],
  flee_vs_defend: [
    "💨 <a href='tg://user?id={winnerId}'>{winnerName}</a> foi esperto e fugiu! <a href='tg://user?id={loserId}'>{loserName}</a> ficou defendendo o vazio! 🤡",
    "💨 <a href='tg://user?id={winnerId}'>{winnerName}</a> escapou como ninja! <a href='tg://user?id={loserId}'>{loserName}</a> defendeu o ar! 🥷",
    "💨 <a href='tg://user?id={winnerId}'>{winnerName}</a> deu no pé! <a href='tg://user?id={loserId}'>{loserName}</a> ficou plantado feito poste! 🚏"
  ],
  tie: [
    "🤝 Empate! Ambos escolheram a mesma ação. <a href='tg://user?id={player1Id}'>{player1Name}</a> e <a href='tg://user?id={player2Id}'>{player2Name}</a> pensam igual! 🧠",
    "🤝 Deu velha! <a href='tg://user?id={player1Id}'>{player1Name}</a> e <a href='tg://user?id={player2Id}'>{player2Name}</a> empataram feio! ⚖️",
    "🤝 Empate técnico! <a href='tg://user?id={player1Id}'>{player1Name}</a> e <a href='tg://user?id={player2Id}'>{player2Name}</a> são irmãos gêmeos mesmo! 👯‍♂️"
  ],
  critical: [
    "💥 CRÍTICO! <a href='tg://user?id={winnerId}'>{winnerName}</a> aplicou um golpe devastador em <a href='tg://user?id={loserId}'>{loserName}</a>! 🔥",
    "💥 HEADSHOT! <a href='tg://user?id={winnerId}'>{winnerName}</a> acertou em cheio! <a href='tg://user?id={loserId}'>{loserName}</a> foi pro lobby! 🎯",
    "💥 DESTRUCTION! <a href='tg://user?id={winnerId}'>{winnerName}</a> obliterou <a href='tg://user?id={loserId}'>{loserName}</a> da existência! ☄️"
  ],
  fail: [
    "🤡 FAIL! <a href='tg://user?id={loserId}'>{loserName}</a> falhou miseravelmente! <a href='tg://user?id={winnerId}'>{winnerName}</a> riu tanto que ganhou! 😂",
    "🤡 EPIC FAIL! <a href='tg://user?id={loserId}'>{loserName}</a> tropeçou na própria estratégia! <a href='tg://user?id={winnerId}'>{winnerName}</a> venceu rindo! 🤣",
    "🤡 QUE FAIL! <a href='tg://user?id={loserId}'>{loserName}</a> errou tão feio que virou meme! <a href='tg://user?id={winnerId}'>{winnerName}</a> ganhou de graça! 📱"
  ]
};

// Função para carregar ranking diário
function loadDailyRanking() {
  try {
    if (fs.existsSync(dailyRankingPath)) {
      const data = JSON.parse(fs.readFileSync(dailyRankingPath, 'utf8'));
      const today = new Date().toDateString();
      
      // Se é um novo dia, reseta o ranking
      if (data.date !== today) {
        const newData = { 
          date: today, 
          ranking: {},
          statistics: {
            totalDuels: 0,
            completedDuels: 0,
            abandonedDuels: 0,
            players: {}
          }
        };
        fs.writeFileSync(dailyRankingPath, JSON.stringify(newData, null, 2));
        return newData;
      }
      
      // Garantir que statistics existe
      if (!data.statistics) {
        data.statistics = {
          totalDuels: 0,
          completedDuels: 0,
          abandonedDuels: 0,
          players: {}
        };
      }
      
      return data;
    } else {
      const newData = { 
        date: new Date().toDateString(), 
        ranking: {},
        statistics: {
          totalDuels: 0,
          completedDuels: 0,
          abandonedDuels: 0,
          players: {}
        }
      };
      fs.writeFileSync(dailyRankingPath, JSON.stringify(newData, null, 2));
      return newData;
    }
  } catch (error) {
    console.error('[ERROR] Erro ao carregar ranking diário:', error.message);
    return { 
      date: new Date().toDateString(), 
      ranking: {},
      statistics: {
        totalDuels: 0,
        completedDuels: 0,
        abandonedDuels: 0,
        players: {}
      }
    };
  }
}

// Função para salvar vitória no ranking
function saveWin(userId, userName) {
  try {
    const data = loadDailyRanking();
    if (!data.ranking[userId]) {
      data.ranking[userId] = { name: userName, wins: 0 };
    }
    data.ranking[userId].wins++;
    data.ranking[userId].name = userName; // Atualiza o nome caso tenha mudado
    fs.writeFileSync(dailyRankingPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[ERROR] Erro ao salvar vitória:', error.message);
  }
}

// Função para salvar estatísticas
function saveStatistics(type, player1Id = null, player1Name = null, player2Id = null, player2Name = null) {
  try {
    const data = loadDailyRanking();
    
    // Incrementar contadores globais
    if (type === 'started') {
      data.statistics.totalDuels++;
    } else if (type === 'completed') {
      data.statistics.completedDuels++;
    } else if (type === 'abandoned') {
      data.statistics.abandonedDuels++;
    }
    
    // Atualizar estatísticas dos jogadores
    const updatePlayerStats = (playerId, playerName, statType) => {
      if (!playerId) return;
      
      if (!data.statistics.players[playerId]) {
        data.statistics.players[playerId] = {
          name: playerName,
          duelsStarted: 0,
          duelsCompleted: 0,
          duelsAbandoned: 0,
          wins: 0
        };
      }
      
      data.statistics.players[playerId].name = playerName; // Atualiza nome
      
      if (statType === 'started') {
        data.statistics.players[playerId].duelsStarted++;
      } else if (statType === 'completed') {
        data.statistics.players[playerId].duelsCompleted++;
      } else if (statType === 'abandoned') {
        data.statistics.players[playerId].duelsAbandoned++;
      } else if (statType === 'win') {
        data.statistics.players[playerId].wins++;
      }
    };
    
    // Aplicar estatísticas baseadas no tipo
    if (type === 'started' && player1Id && player2Id) {
      updatePlayerStats(player1Id, player1Name, 'started');
      updatePlayerStats(player2Id, player2Name, 'started');
    } else if (type === 'completed' && player1Id && player2Id) {
      updatePlayerStats(player1Id, player1Name, 'completed');
      updatePlayerStats(player2Id, player2Name, 'completed');
    } else if (type === 'abandoned') {
      if (player1Id) updatePlayerStats(player1Id, player1Name, 'abandoned');
      if (player2Id) updatePlayerStats(player2Id, player2Name, 'abandoned');
    } else if (type === 'win' && player1Id) {
      updatePlayerStats(player1Id, player1Name, 'win');
    }
    
    fs.writeFileSync(dailyRankingPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[ERROR] Erro ao salvar estatísticas:', error.message);
  }
}

// Função para formatar menção HTML
function formatMention(userId, name) {
  return `<a href="tg://user?id=${userId}">${name}</a>`;
}

// Função para obter frase aleatória
function getRandomPhrase(phrasesArray, replacements = {}) {
  const phrase = phrasesArray[Math.floor(Math.random() * phrasesArray.length)];
  let result = phrase;
  
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  
  return result;
}

// Função para determinar o vencedor
function determineWinner(action1, action2) {
  if (action1 === action2) return 'tie';
  
  const rules = {
    'attack': 'flee',    // Ataque vence Fuga
    'defend': 'attack',  // Defesa vence Ataque  
    'flee': 'defend'     // Fuga vence Defesa
  };
  
  return rules[action1] === action2 ? 'player1' : 'player2';
}

// Função para processar resultado do duelo
function processDuelResult(challengerId, challengerName, challengedId, challengedName, challengerAction, challengedAction) {
  // Chances especiais
  const randomChance = Math.random();
  const isCritical = randomChance < 0.05; // 5% chance de crítico
  const isFail = randomChance >= 0.05 && randomChance < 0.15; // 10% chance de fail
  
  let winner, loser, resultType;
  
  if (isCritical || isFail) {
    // Em caso de crítico ou fail, o resultado é aleatório
    const players = [
      { id: challengerId, name: challengerName },
      { id: challengedId, name: challengedName }
    ];
    const winnerIndex = Math.floor(Math.random() * 2);
    winner = players[winnerIndex];
    loser = players[1 - winnerIndex];
    resultType = isCritical ? 'critical' : 'fail';
  } else {
    const result = determineWinner(challengerAction, challengedAction);
    
    if (result === 'tie') {
      return getRandomPhrase(duelResults.tie, {
        player1Id: challengerId,
        player1Name: challengerName,
        player2Id: challengedId,
        player2Name: challengedName
      });
    }
    
    if (result === 'player1') {
      winner = { id: challengerId, name: challengerName };
      loser = { id: challengedId, name: challengedName };
    } else {
      winner = { id: challengedId, name: challengedName };
      loser = { id: challengerId, name: challengerName };
    }
    
    // Determinar tipo de resultado baseado nas ações
    if (challengerAction === 'attack' && challengedAction === 'flee') {
      resultType = 'attack_vs_flee';
    } else if (challengerAction === 'flee' && challengedAction === 'attack') {
      resultType = 'attack_vs_flee';
    } else if (challengerAction === 'defend' && challengedAction === 'attack') {
      resultType = 'defend_vs_attack';
    } else if (challengerAction === 'attack' && challengedAction === 'defend') {
      resultType = 'defend_vs_attack';
    } else if (challengerAction === 'flee' && challengedAction === 'defend') {
      resultType = 'flee_vs_defend';
    } else if (challengerAction === 'defend' && challengedAction === 'flee') {
      resultType = 'flee_vs_defend';
    }
  }
  
  // Salvar vitória no ranking
  saveWin(winner.id, winner.name);
  
  return getRandomPhrase(duelResults[resultType], {
    winnerId: winner.id,
    winnerName: winner.name,
    loserId: loser.id,
    loserName: loser.name
  });
}

module.exports = (bot) => {
  // Comando /x1
  bot.command('x1', async (ctx) => {
    try {
      const message = ctx.message;
      const challenger = message.from;
      
      // Verificar se é uma resposta a outra mensagem
      if (!message.reply_to_message) {
        // Jogar sozinho - usar frase aleatória
        const phrase = getRandomPhrase(soloLosePhrases, {
          userId: challenger.id,
          username: challenger.first_name || challenger.username || 'Anônimo'
        });
        
        return ctx.reply(phrase, { 
          parse_mode: 'HTML',
          reply_to_message_id: message.message_id
        });
      }
      
      const challenged = message.reply_to_message.from;
      
      // Verificar se não está tentando desafiar a si mesmo
      if (challenger.id === challenged.id) {
        const phrase = getRandomPhrase(soloLosePhrases, {
          userId: challenger.id,
          username: challenger.first_name || challenger.username || 'Anônimo'
        });
        
        return ctx.reply(phrase, { 
          parse_mode: 'HTML',
          reply_to_message_id: message.message_id
        });
      }
      
      // Verificar se já existe um duelo ativo entre estes usuários
      const duelKey = `${Math.min(challenger.id, challenged.id)}-${Math.max(challenger.id, challenged.id)}`;
      
      if (activeDuels.has(duelKey)) {
        return ctx.reply(
          `⚡ Já existe um duelo rolando entre ${formatMention(challenger.id, challenger.first_name)} e ${formatMention(challenged.id, challenged.first_name)}! Aguardem o resultado!`,
          { 
            parse_mode: 'HTML',
            reply_to_message_id: message.message_id
          }
        );
      }
      
      // Criar novo duelo
      const duel = {
        challengerId: challenger.id,
        challengerName: challenger.first_name || challenger.username || 'Anônimo',
        challengedId: challenged.id,
        challengedName: challenged.first_name || challenged.username || 'Anônimo',
        challengerAction: null,
        challengedAction: null,
        messageId: null,
        chatId: ctx.chat.id,
        startTime: new Date().getTime(),
        originalMessageId: message.message_id
      };
      
      activeDuels.set(duelKey, duel);
      
      // Salvar estatística de duelo iniciado
      saveStatistics('started', challenger.id, challenger.first_name, challenged.id, challenged.first_name);
      
      // Criar botões inline
      const keyboard = {
        inline_keyboard: [
          [
            { text: '⚔️ Atacar', callback_data: `x1_attack_${duelKey}` },
            { text: '🛡️ Defender', callback_data: `x1_defend_${duelKey}` },
            { text: '💨 Fugir', callback_data: `x1_flee_${duelKey}` }
          ]
        ]
      };
      
      const duelMessage = await ctx.reply(
        `🔥 <b>DUELO INICIADO!</b> 🔥\n\n` +
        `${formatMention(challenger.id, challenger.first_name)} desafiou ${formatMention(challenged.id, challenged.first_name)} para um X1!\n\n` +
        `⚡ <b>${challenged.first_name}</b>, escolha sua ação:`,
        { 
          parse_mode: 'HTML',
          reply_markup: keyboard,
          reply_to_message_id: message.message_id
        }
      );
      
      duel.messageId = duelMessage.message_id;
      
      // Remover duelo após 30 minutos se não for concluído
      setTimeout(() => {
        if (activeDuels.has(duelKey)) {
          const expiredDuel = activeDuels.get(duelKey);
          activeDuels.delete(duelKey);
          
          // Verificar quem participou e quem abandonou
          let message;
          if (expiredDuel.challengerAction && !expiredDuel.challengedAction) {
            // Challenger participou, challenged abandonou
            message = getRandomPhrase(abandonmentPhrases.singleAbandon, {
              waiterId: expiredDuel.challengerId,
              waiterName: expiredDuel.challengerName,
              abandonerId: expiredDuel.challengedId,
              abandonerName: expiredDuel.challengedName
            });
            saveWin(expiredDuel.challengerId, expiredDuel.challengerName);
            saveStatistics('abandoned', expiredDuel.challengedId, expiredDuel.challengedName);
          } else if (!expiredDuel.challengerAction && expiredDuel.challengedAction) {
            // Challenged participou, challenger abandonou  
            message = getRandomPhrase(abandonmentPhrases.singleAbandon, {
              waiterId: expiredDuel.challengedId,
              waiterName: expiredDuel.challengedName,
              abandonerId: expiredDuel.challengerId,
              abandonerName: expiredDuel.challengerName
            });
            saveWin(expiredDuel.challengedId, expiredDuel.challengedName);
            saveStatistics('abandoned', expiredDuel.challengerId, expiredDuel.challengerName);
          } else {
            // Ambos abandonaram
            message = `⏰ <b>Duelo expirado!</b>\n\n${getRandomPhrase(abandonmentPhrases.doubleAbandon)}`;
            saveStatistics('abandoned', expiredDuel.challengerId, expiredDuel.challengerName, expiredDuel.challengedId, expiredDuel.challengedName);
          }
          
          // Enviar mensagem de abandono como resposta ao comando original
          ctx.telegram.sendMessage(
            ctx.chat.id,
            message,
            { 
              parse_mode: 'HTML',
              reply_to_message_id: expiredDuel.originalMessageId
            }
          ).catch(() => {});
          
          // Remover botões da mensagem original
          ctx.telegram.editMessageReplyMarkup(
            ctx.chat.id,
            duelMessage.message_id,
            null,
            { inline_keyboard: [] }
          ).catch(() => {});
        }
      }, DUEL_TIMEOUT); // 30 minutos
      
    } catch (error) {
      console.error('[ERROR] Erro no comando /x1:', error.message);
      ctx.reply('❌ Ocorreu um erro ao iniciar o duelo. Tente novamente!', {
        reply_to_message_id: ctx.message.message_id
      });
    }
  });
  
  // Handler para os botões do duelo
  bot.on('callback_query', async (ctx) => {
    try {
      const data = ctx.callbackQuery.data;
      
      if (!data.startsWith('x1_')) return;
      
      const [, action, duelKey] = data.split('_');
      const duel = activeDuels.get(duelKey);
      
      if (!duel) {
        return ctx.answerCbQuery('⏰ Este duelo já expirou!', { show_alert: true });
      }
      
      const userId = ctx.callbackQuery.from.id;
      const userName = ctx.callbackQuery.from.first_name || ctx.callbackQuery.from.username || 'Anônimo';
      
      // Verificar se o usuário pode participar deste duelo
      if (userId !== duel.challengerId && userId !== duel.challengedId) {
        return ctx.answerCbQuery(
          `Esse X1 não é seu, ${userName}! Vai arrumar outro desafiante. 😤`,
          { show_alert: true }
        );
      }
      
      // Verificar se o usuário já escolheu uma ação
      if (userId === duel.challengerId && duel.challengerAction) {
        return ctx.answerCbQuery('Você já escolheu sua ação! Aguarde o oponente.', { show_alert: true });
      }
      
      if (userId === duel.challengedId && duel.challengedAction) {
        return ctx.answerCbQuery('Você já escolheu sua ação! Aguarde o oponente.', { show_alert: true });
      }
      
      // Registrar a ação
      if (userId === duel.challengerId) {
        duel.challengerAction = action;
      } else {
        duel.challengedAction = action;
      }
      
      const actionEmojis = { attack: '⚔️', defend: '🛡️', flee: '💨' };
      
      ctx.answerCbQuery(`Você escolheu: ${actionEmojis[action]} ${action === 'attack' ? 'Atacar' : action === 'defend' ? 'Defender' : 'Fugir'}!`);
      
      // Verificar se ambos já escolheram
      if (duel.challengerAction && duel.challengedAction) {
        // Processar resultado
        const result = processDuelResult(
          duel.challengerId,
          duel.challengerName,
          duel.challengedId,
          duel.challengedName,
          duel.challengerAction,
          duel.challengedAction
        );
        
        // Salvar estatística de duelo completado
        saveStatistics('completed', duel.challengerId, duel.challengerName, duel.challengedId, duel.challengedName);
        
        // Enviar mensagem com o resultado
        await ctx.telegram.sendMessage(
          duel.chatId,
          `🏁 <b>RESULTADO DO DUELO!</b> 🏁\n\n${result}`,
          { 
            parse_mode: 'HTML',
            reply_to_message_id: duel.originalMessageId
          }
        );
        
        // Remover botões da mensagem original
        await ctx.telegram.editMessageReplyMarkup(
          duel.chatId,
          duel.messageId,
          null,
          { inline_keyboard: [] }
        ).catch(() => {});
        
        // Remover duelo da memória
        activeDuels.delete(duelKey);
      } else {
        // Atualizar mensagem mostrando quem ainda precisa escolher
        const waitingForId = duel.challengerAction ? duel.challengedId : duel.challengerId;
        const waitingForName = duel.challengerAction ? duel.challengedName : duel.challengerName;
        await ctx.telegram.editMessageText(
          duel.chatId,
          duel.messageId,
          null,
          `🔥 <b>DUELO EM ANDAMENTO!</b> 🔥\n\n` +
          `${formatMention(duel.challengerId, duel.challengerName)} ${duel.challengerAction ? '✅' : '⏳'}\n` +
          `${formatMention(duel.challengedId, duel.challengedName)} ${duel.challengedAction ? '✅' : '⏳'}\n\n` +
          `⚡ Aguardando ${formatMention(waitingForId, waitingForName)} para finalizar o X1...`,
          { 
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⚔️ Atacar', callback_data: `x1_attack_${duelKey}` },
                  { text: '🛡️ Defender', callback_data: `x1_defend_${duelKey}` },
                  { text: '💨 Fugir', callback_data: `x1_flee_${duelKey}` }
                ]
              ]
            }
          }
        );
      }
      
    } catch (error) {
      console.error('[ERROR] Erro no callback do duelo:', error.message);
      ctx.answerCbQuery('❌ Erro ao processar ação!', { show_alert: true });
    }
  });
};