// Frases para quando o usuário tenta /x1 sozinho ou desafia a si mesmo
const soloLosePhrases = [
  '😅 <a href="tg://user?id={userId}">{username}</a> tentou duelar sozinho e perdeu para o próprio ego! Tente desafiar alguém de verdade!',
  '🙃 {username}, X1 solo não vale! Chame alguém para a treta!',
  '😂 {username} tentou desafiar a si mesmo e perdeu! Melhor chamar um amigo.',
  '🪞 {username} duelou com o espelho e... perdeu! Escolha um adversário real.',
  '🤦‍♂️ {username}, não dá pra duelar sozinho! Marca alguém aí!',
  '👻 {username} tentou duelar com um fantasma. Não deu certo!',
  '🥲 {username} foi rejeitado até pelo bot. Chama alguém pro X1!',
  '🫥 {username} tentou X1 solo. O bot ficou com vergonha alheia.',
  '😬 {username}, desafiar a si mesmo não conta! Bora pra um X1 de verdade!',
  '🦾 {username} tentou X1 contra o próprio dedo. Não funcionou!',
  '🫣 {username} duelou sozinho e perdeu. Chama alguém pra não passar vergonha!',
  '🤷‍♂️ {username}, X1 precisa de dois! Marca um amigo!',
  '🫡 {username} tentou X1 solo. O bot recomenda terapia!',
  '😹 {username} duelou sozinho e perdeu até pra sorte!',
  '🫠 {username} tentou X1 solo. O bot ficou sem reação!'
];

// Frases para quando o bot é desafiado
const botChallengedPhrases = [
  '🤖 {username}, você realmente acha que tem chance contra mim? Eu dropei em Tilted Towers antes de você nascer! 😎',
  '🎮 {username}, eu tenho 99999 de Victory Royale! Você ainda tá treinando no Playground! 🏆',
  '⚡ {username}, meu ping é 0ms e meu aim é perfeito! Você não tem chance, noob! 🎯',
  '🚀 {username}, eu construo mais rápido que a luz! Seus 90s são lentos demais pra mim! 🏗️',
  '👑 {username}, eu sou o rei do Battle Royale! Você ainda tá aprendendo a abrir baú! 📦'
];

// Frases temáticas para lógica B (lobby especial)
const duelBonusPhrases = [
  '🎮 Lobby Especial! {winner} estava {winnerTryhard}% tryhard, mas escorregou na banana do {loser} ({loserBanana}% embananado) e perdeu feio! 🍌',
  '🍌 O embananado {winner} surpreendeu e venceu o tryhard {loser} no lobby bonus! Fortnite é imprevisível!',
  '🔥 {loser} estava se achando o pro player ({loserTryhard}% tryhard), mas foi trollado pelo azar e caiu do ônibus! 😂',
  '🥇 {winner} venceu no lobby especial, mesmo com {winnerBanana}% de trapalhadas!',
  '🏆 {loser} tentou ser tryhard ({loserTryhard}%), mas o embananado {winner} levou a melhor!',
  '🍌 {winner} ativou o modo banana suprema e derrubou o tryhard {loser}!',
  '🎲 Sorte troll! {winner} ganhou no lobby bonus, mesmo sendo mais embananado!',
  '🤣 {loser} estava 99% tryhard, mas tropeçou no próprio loot e perdeu para o {winner}!',
  '🏅 {winner} venceu no evento especial, mostrando que banana também ganha partida!',
  '🥑 {loser} foi tryhard demais e se embananou, vitória para {winner}!',
  '🥳 {winner} ganhou no lobby especial, Fortnite é zoeira até no X1!',
  '🥷 {loser} tentou ser ninja ({loserTryhard}%), mas o azar foi maior!',
  '🥔 {winner} venceu no lobby bonus, mostrando que até batata ganha de tryhard!',
  '🏹 {loser} errou o tiro final, vitória embananada para {winner}!',
  '🏖️ {winner} só queria brincar, mas acabou ganhando do tryhard {loser} no evento especial!'
];

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
    "O X1 mais silencioso da história. Até o crickets pararam de fazer barulho. 🦗"
  ]
};

// Tempo limite para duelos (30 minutos)
const DUEL_TIMEOUT = 30 * 60 * 1000;

// Armazenar duelos ativos em memória
const activeDuels = new Map();

// Importar funções MySQL
const { getDailyTryhardData, saveX1Win, saveX1Statistics, ensureBotGroup, ensureUser, saveDuelMove, createDuelRecord, updateDuelResult, updateDuelStats } = require('../../../utils/databaseUtilsMySQL');

// Utilitário para buscar dados tryhard/banana do dia (agora usa MySQL)
async function getTryhardData(groupId, userId) {
  try {
    const data = await getDailyTryhardData(groupId, userId);
    return data;
  } catch (e) {
    console.error('[ERROR] Erro ao buscar dados tryhard:', e.message);
    return null;
  }
}

// Função para salvar vitória no ranking por grupo (agora usa MySQL)
async function saveWin(groupId, userId, userName) {
  try {
    await saveX1Win(groupId, userId, userName);
  } catch (error) {
    console.error('[ERROR] Erro ao salvar vitória:', error.message);
  }
}

// Função para salvar estatísticas por grupo (agora usa MySQL)
async function saveStatistics(groupId, type, player1Id = null, player1Name = null, player2Id = null, player2Name = null) {
  try {
    await saveX1Statistics(groupId, type, player1Id, player1Name, player2Id, player2Name);
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

// Utilitário para enviar erro ao grupo de logs
async function sendErrorToLogGroup(error, context) {
  try {
    const config = require('../../config/config');
    if (config.logGroup && config.logGroup.status && config.logGroup.id) {
      let msg = `❌ <b>Erro no comando /x1</b>\n`;
      if (context) {
        msg += `<b>Contexto:</b> ${context}\n`;
      }
      msg += `<pre>${(error && error.stack) ? error.stack : error}</pre>`;
      const botApi = require('telegraf');
      // Enviar mensagem para o grupo de logs
      const bot = new botApi.Telegraf(config.apiKey);
      await bot.telegram.sendMessage(config.logGroup.id, msg, { parse_mode: 'HTML', message_thread_id: config.logGroup.topic || undefined });
    }
  } catch (e) {
    console.error('[ERROR] Falha ao enviar erro ao grupo de logs:', e.message);
  }
}

module.exports = (bot) => {
  // Comando /x1
  bot.command('x1', async (ctx) => {
    try {
      console.log('[DEBUG] /x1 chamado', {
        chatId: ctx.chat?.id,
        from: ctx.from?.id,
        text: ctx.message?.text
      });
      
      // Garantir que o grupo existe no banco de dados
      const groupId = String(ctx.chat.id);
      const groupName = ctx.chat.title || 'Grupo sem nome';
      await ensureBotGroup(groupId, groupName);
      
      const message = ctx.message;
      const challenger = message.from;
      
      // Obter o ID do bot
      const botInfo = await ctx.telegram.getMe();
      const botId = botInfo.id;
      
      // Extrair menção se houver
      let challenged = null;
      let hasMentionByUsername = false;
      
      // Verificar se é reply
      if (message.reply_to_message) {
        challenged = message.reply_to_message.from;
      } 
      // Verificar se há menção no texto
      else if (message.entities) {
        const mention = message.entities.find(e => e.type === 'mention' || e.type === 'text_mention');
        if (mention) {
          if (mention.type === 'text_mention') {
            // Menção inline (clicável) - temos acesso ao objeto do usuário
            challenged = mention.user;
          } else if (mention.type === 'mention') {
            // Menção por @username - API do Telegram não fornece o ID automaticamente
            hasMentionByUsername = true;
          }
        }
      }
      
      console.log('[DEBUG] /x1 contexto inicial', {
        isReply: !!message.reply_to_message,
        hasMention: !!challenged,
        hasMentionByUsername: hasMentionByUsername,
        challengerId: challenger?.id,
        challengedId: challenged?.id,
        chatId: ctx.chat?.id
      });
      
      // Verificar se há menção por @username (que não conseguimos processar)
      if (hasMentionByUsername && !challenged) {
        console.log('[DEBUG] /x1 menção por @username detectada');
        return ctx.reply(
          '⚠️ Para desafiar alguém, você precisa <b>responder à mensagem</b> da pessoa!\n\n' +
          '💡 Menções com @usuario não funcionam porque não consigo identificar quem você quer desafiar.\n\n' +
          '✅ <b>Como usar:</b> Responda uma mensagem da pessoa e digite /x1',
          { 
            parse_mode: 'HTML',
            reply_to_message_id: message.message_id
          }
        );
      }
      
      // Verificar se não há ninguém sendo desafiado
      if (!challenged) {
        // Jogar sozinho - usar frase aleatória
        console.log('[DEBUG] /x1 não é reply, enviando frase solo');
        const phrase = getRandomPhrase(soloLosePhrases, {
          userId: challenger.id,
          username: challenger.first_name || challenger.username || 'Anônimo'
        });
        return ctx.reply(phrase, { 
          parse_mode: 'HTML',
          reply_to_message_id: message.message_id
        });
      }
      
      // Verificar se está desafiando o bot
      if (challenged.id === botId) {
        console.log('[DEBUG] /x1 desafiando o bot');
        const phrase = getRandomPhrase(botChallengedPhrases, {
          username: challenger.first_name || challenger.username || 'Anônimo'
        });
        return ctx.reply(phrase, { 
          parse_mode: 'HTML',
          reply_to_message_id: message.message_id
        });
      }
      
      // Verificar se não está tentando desafiar a si mesmo
      if (challenger.id === challenged.id) {
        console.log('[DEBUG] /x1 desafiando a si mesmo');
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
        console.log('[DEBUG] /x1 duelo já ativo', { duelKey });
        return ctx.reply(
          `⚡ Já existe um duelo rolando entre ${formatMention(challenger.id, challenger.first_name)} e ${formatMention(challenged.id, challenged.first_name)}! Aguardem o resultado!`,
          { 
            parse_mode: 'HTML',
            reply_to_message_id: message.message_id
          }
        );
      }
      
      // Garantir que ambos os usuários existem no banco de dados ANTES de criar o duelo
      await ensureUser(String(challenger.id), 1, { first_name: challenger.first_name, username: challenger.username });
      await ensureUser(String(challenged.id), 1, { first_name: challenged.first_name, username: challenged.username });
      
      // Criar registro do duelo no banco de dados
      const duelId = await createDuelRecord(groupId, challenger.id, challenged.id);
      
      // Criar novo duelo em memória
      const duel = {
        duelId: duelId,
        challengerId: challenger.id,
        challengerName: challenger.first_name || challenger.username || 'Anônimo',
        challengedId: challenged.id,
        challengedName: challenged.first_name || challenged.username || 'Anônimo',
        challengerAction: null,
        challengedAction: null,
        messageId: null,
        chatId: ctx.chat.id,
        startTime: new Date().getTime(),
        originalMessageId: message.message_id,
        groupId
      };
      activeDuels.set(duelKey, duel);
      console.log('[DEBUG] /x1 duelo criado', { duelKey, challenger: duel.challengerId, challenged: duel.challengedId, groupId });
      
      // Salvar estatística de duelo iniciado
      await saveStatistics(groupId, 'started', challenger.id, challenger.first_name, challenged.id, challenged.first_name);
      
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
      console.log('[DEBUG] /x1 mensagem de duelo enviada', { messageId: duel.messageId });
      
      // Remover duelo após 30 minutos se não for concluído
      setTimeout(async () => {
        if (activeDuels.has(duelKey)) {
          const expiredDuel = activeDuels.get(duelKey);
          activeDuels.delete(duelKey);
          let message;
          if (expiredDuel.challengerAction && !expiredDuel.challengedAction) {
            message = getRandomPhrase(abandonmentPhrases.singleAbandon, {
              waiterId: expiredDuel.challengerId,
              waiterName: expiredDuel.challengerName,
              abandonerId: expiredDuel.challengedId,
              abandonerName: expiredDuel.challengedName
            });
            await saveWin(expiredDuel.groupId, expiredDuel.challengerId, expiredDuel.challengerName);
            await saveStatistics(expiredDuel.groupId, 'abandoned', expiredDuel.challengedId, expiredDuel.challengedName);
            await updateDuelResult(expiredDuel.duelId, expiredDuel.challengerId, 'abandoned');
          } else if (!expiredDuel.challengerAction && expiredDuel.challengedAction) {
            message = getRandomPhrase(abandonmentPhrases.singleAbandon, {
              waiterId: expiredDuel.challengedId,
              waiterName: expiredDuel.challengedName,
              abandonerId: expiredDuel.challengerId,
              abandonerName: expiredDuel.challengerName
            });
            await saveWin(expiredDuel.groupId, expiredDuel.challengedId, expiredDuel.challengedName);
            await saveStatistics(expiredDuel.groupId, 'abandoned', expiredDuel.challengerId, expiredDuel.challengerName);
            await updateDuelResult(expiredDuel.duelId, expiredDuel.challengedId, 'abandoned');
          } else {
            message = `⏰ <b>Duelo expirado!</b>\n\n${getRandomPhrase(abandonmentPhrases.doubleAbandon)}`;
            await saveStatistics(expiredDuel.groupId, 'abandoned', expiredDuel.challengerId, expiredDuel.challengerName, expiredDuel.challengedId, expiredDuel.challengedName);
            await updateDuelResult(expiredDuel.duelId, null, 'abandoned');
          }
          ctx.telegram.sendMessage(
            ctx.chat.id,
            message,
            { 
              parse_mode: 'HTML',
              reply_to_message_id: expiredDuel.originalMessageId
            }
          ).catch(() => {});
          ctx.telegram.editMessageReplyMarkup(
            ctx.chat.id,
            duelMessage.message_id,
            null,
            { inline_keyboard: [] }
          ).catch(() => {});
        }
      }, DUEL_TIMEOUT); // 30 minutos
      
    } catch (error) {
      console.error('[ERROR] Erro no comando /x1:', error);
      await sendErrorToLogGroup(error, '/x1');
      ctx.reply('❌ Ocorreu um erro ao iniciar o duelo. Tente novamente!', {
        reply_to_message_id: ctx.message.message_id
      });
    }
  });
  
  // Handler para os botões do duelo (apenas x1_)
  bot.action(/^x1_/, async (ctx) => {
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
        // Salvar movimento no banco de dados
        await saveDuelMove(duel.duelId, userId, action, 1);
      } else {
        duel.challengedAction = action;
        // Salvar movimento no banco de dados
        await saveDuelMove(duel.duelId, userId, action, 2);
      }
      
      const actionEmojis = { attack: '⚔️', defend: '🛡️', flee: '💨' };
      
      ctx.answerCbQuery(`Você escolheu: ${actionEmojis[action]} ${action === 'attack' ? 'Atacar' : action === 'defend' ? 'Defender' : 'Fugir'}!`, { show_alert: true });
      
      // Verificar se ambos já escolheram
      if (duel.challengerAction && duel.challengedAction) {
        // Lógica especial: 50% de chance de ativar lobby temático se ambos tiverem dados tryhard/banana
        const groupId = duel.groupId;
        const challengerTryhard = await getTryhardData(groupId, String(duel.challengerId));
        const challengedTryhard = await getTryhardData(groupId, String(duel.challengedId));
        let useBonusLogic = false;
        if (challengerTryhard && challengedTryhard && Math.random() < 0.5) {
          useBonusLogic = true;
        }
        let duelResult;
        let winner, loser;
        if (useBonusLogic) {
          // Escolhe vencedor aleatório
          const players = [
            { id: duel.challengerId, name: duel.challengerName, tryhard: challengerTryhard.tryhard, banana: challengerTryhard.banana },
            { id: duel.challengedId, name: duel.challengedName, tryhard: challengedTryhard.tryhard, banana: challengedTryhard.banana }
          ];
          const winnerIndex = Math.floor(Math.random() * 2);
          winner = players[winnerIndex];
          loser = players[1 - winnerIndex];
          // Escolhe frase temática
          const phrase = duelBonusPhrases[Math.floor(Math.random() * duelBonusPhrases.length)];
          duelResult = phrase
            .replace(/{winner}/g, winner.name)
            .replace(/{loser}/g, loser.name)
            .replace(/{winnerTryhard}/g, winner.tryhard)
            .replace(/{winnerBanana}/g, winner.banana)
            .replace(/{loserTryhard}/g, loser.tryhard)
            .replace(/{loserBanana}/g, loser.banana);
          duelResult = `🎉 <b>LOBBY ESPECIAL ATIVADO!</b> 🎉\n${duelResult}`;
          console.log('[DEBUG] Duelo bônus - Salvando vitória', { groupId: duel.groupId, winnerId: winner.id, winnerName: winner.name });
        } else {
          // Lógica normal
          // Chances especiais
          const randomChance = Math.random();
          const isCritical = randomChance < 0.05;
          const isFail = randomChance >= 0.05 && randomChance < 0.15;
          let resultType;
          if (isCritical || isFail) {
            const players = [
              { id: duel.challengerId, name: duel.challengerName },
              { id: duel.challengedId, name: duel.challengedName }
            ];
            const winnerIndex = Math.floor(Math.random() * 2);
            winner = players[winnerIndex];
            loser = players[1 - winnerIndex];
            resultType = isCritical ? 'critical' : 'fail';
          } else {
            const result = determineWinner(duel.challengerAction, duel.challengedAction);
            if (result === 'tie') {
              duelResult = getRandomPhrase(duelResults.tie, {
                player1Id: duel.challengerId,
                player1Name: duel.challengerName,
                player2Id: duel.challengedId,
                player2Name: duel.challengedName
              });
              // Salvar estatística de duelo completado
              await saveStatistics(duel.groupId, 'completed', duel.challengerId, duel.challengerName, duel.challengedId, duel.challengedName);
              await ctx.telegram.sendMessage(
                duel.chatId,
                `🏁 <b>RESULTADO DO DUELO!</b> 🏁\n\n${duelResult}`,
                { 
                  parse_mode: 'HTML',
                  reply_to_message_id: duel.originalMessageId
                }
              );
              await ctx.telegram.editMessageReplyMarkup(
                duel.chatId,
                duel.messageId,
                null,
                { inline_keyboard: [] }
              ).catch(() => {});
              activeDuels.delete(duelKey);
              return;
            }
            if (result === 'player1') {
              winner = { id: duel.challengerId, name: duel.challengerName };
              loser = { id: duel.challengedId, name: duel.challengedName };
            } else {
              winner = { id: duel.challengedId, name: duel.challengedName };
              loser = { id: duel.challengerId, name: duel.challengerName };
            }
            if (duel.challengerAction === 'attack' && duel.challengedAction === 'flee') {
              resultType = 'attack_vs_flee';
            } else if (duel.challengerAction === 'flee' && duel.challengedAction === 'attack') {
              resultType = 'attack_vs_flee';
            } else if (duel.challengerAction === 'defend' && duel.challengedAction === 'attack') {
              resultType = 'defend_vs_attack';
            } else if (duel.challengerAction === 'attack' && duel.challengedAction === 'defend') {
              resultType = 'defend_vs_attack';
            } else if (duel.challengerAction === 'flee' && duel.challengedAction === 'defend') {
              resultType = 'flee_vs_defend';
            } else if (duel.challengerAction === 'defend' && duel.challengedAction === 'flee') {
              resultType = 'flee_vs_defend';
            }
          }
          duelResult = getRandomPhrase(duelResults[resultType], {
            winnerId: winner.id,
            winnerName: winner.name,
            loserId: loser.id,
            loserName: loser.name
          });
        }
        // Salvar vitória e estatísticas no ranking por grupo
        console.log('[DEBUG] Salvando vitória do duelo', { groupId: duel.groupId, winnerId: winner.id, winnerName: winner.name });
        await saveWin(duel.groupId, String(winner.id), winner.name);
        
        // Se foi LOBBY ESPECIAL, incrementar tryhard para o vencedor
        if (useBonusLogic) {
          console.log('[DEBUG] Lobby especial - Incrementando tryhard do vencedor', { winnerId: winner.id, winnerName: winner.name });
          await updateDuelStats(duel.groupId, String(winner.id), winner.name, { tryhard: 1 });
        }
        
        // Atualizar resultado do duelo no banco
        await updateDuelResult(duel.duelId, winner.id, 'completed');
        
        // Salvar estatística de duelo completado
        await saveStatistics(duel.groupId, 'completed', duel.challengerId, duel.challengerName, duel.challengedId, duel.challengedName);
        
        // Excluir a mensagem de "DUELO EM ANDAMENTO" ANTES de enviar o resultado
        await ctx.telegram.deleteMessage(duel.chatId, duel.messageId).catch(() => {});
        
        // Enviar mensagem com o resultado
        await ctx.telegram.sendMessage(
          duel.chatId,
          `🏁 <b>RESULTADO DO DUELO!</b> 🏁\n\n${duelResult}`,
          { 
            parse_mode: 'HTML',
            reply_to_message_id: duel.originalMessageId
          }
        );
        
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
      await sendErrorToLogGroup(error, 'callback x1');
      ctx.answerCbQuery('❌ Erro ao processar ação!', { show_alert: true });
    }
  });
};
