const fs = require('fs');
const path = require('path');

// Caminho para o banco de dados de ranking diário
const dailyRankingPath = path.join(__dirname, '../../database/dailyx1.json');
const broadcastPath = path.join(__dirname, '../../database/broadcast.json');

// Função para enviar mensagem com retry e respeito ao rate limit
async function sendMessageWithRetry(bot, chatId, content, options = {}, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await bot.telegram.sendMessage(chatId, content, options);
    } catch (error) {
      attempt++;
      
      // Verificar se é erro de rate limit
      if (error.response && error.response.parameters && error.response.parameters.retry_after) {
        const retryAfter = error.response.parameters.retry_after;
        console.log(`[WARNING] Rate limit atingido. Aguardando ${retryAfter} segundos antes de retentar...`);
        await new Promise(resolve => setTimeout(resolve, (retryAfter + 1) * 1000));
      } else if (attempt < maxRetries) {
        // Erro genérico, aguardar 2 segundos
        console.error(`[ERROR] Falha ao enviar mensagem (tentativa ${attempt}/${maxRetries}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }
}

// Função para formatar menção HTML
function formatMention(userId, name) {
  return `<a href="tg://user?id=${userId}">${name}</a>`;
}

// Função para obter emoji de posição
function getPositionEmoji(position) {
  const emojis = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
  };
  return emojis[position] || '🏅';
}

module.exports = async (bot) => {
  // Data de hoje no formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Carregar grupos do broadcast.json
  let broadcastGroups = [];
  if (fs.existsSync(broadcastPath)) {
    const broadcastData = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
    if (broadcastData.groups) {
      broadcastGroups = Object.values(broadcastData.groups);
    }
  }

  // Carregar ranking diário
  let dailyData = {};
  if (fs.existsSync(dailyRankingPath)) {
    dailyData = JSON.parse(fs.readFileSync(dailyRankingPath, 'utf8'));
  }

  // Mensagem global (todos os grupos juntos)
  let globalRanking = {};
  for (const groupId in (dailyData[today] || {})) {
    const group = dailyData[today][groupId];
    if (group && group.ranking) {
      for (const userId in group.ranking) {
        if (!globalRanking[userId]) {
          globalRanking[userId] = { ...group.ranking[userId] };
        } else {
          globalRanking[userId].wins += group.ranking[userId].wins;
        }
      }
    }
  }
  // Ordenar global
  const sortedGlobal = Object.entries(globalRanking)
    .map(([userId, userData]) => ({ userId, ...userData }))
    .sort((a, b) => b.wins - a.wins);

  let globalMsg = '🌎 <b>Ranking Global de X1 do dia:</b>\n\n';
  if (sortedGlobal.length === 0) {
    globalMsg += '🤷‍♂️ Ninguém duelou hoje ainda!\n';
  } else {
    // Mostrar apenas os 10 primeiros
    const top10Global = sortedGlobal.slice(0, 10);
    top10Global.forEach((user, index) => {
      const position = index + 1;
      const emoji = getPositionEmoji(position);
      const mention = formatMention(user.userId, user.name);
      const wins = user.wins;
      const winsText = wins === 1 ? 'vitória' : 'vitórias';
      globalMsg += `${emoji} <b>${position}.</b> ${mention} – ${wins} ${winsText}\n`;
    });
    if (sortedGlobal.length > 10) {
      globalMsg += `\n<i>... e mais ${sortedGlobal.length - 10} jogadores</i>\n`;
    }
  }
  globalMsg += '\n💡 <i>O ranking reseta todo dia à meia-noite!</i>';

  // Enviar ranking para cada grupo
  for (const group of broadcastGroups) {
    let groupMsg = `🏆 <b>Ranking de X1 do dia (${group.name}):</b>\n\n`;
    const groupData = (dailyData[today] && dailyData[today][group.id]) ? dailyData[today][group.id] : null;
    if (!groupData || !groupData.ranking || Object.keys(groupData.ranking).length === 0) {
      groupMsg += '🤷‍♂️ Ninguém duelou hoje ainda!\n';
    } else {
      const sortedUsers = Object.entries(groupData.ranking)
        .map(([userId, userData]) => ({ userId, ...userData }))
        .sort((a, b) => b.wins - a.wins);
      
      // Mostrar apenas os 10 primeiros
      const top10 = sortedUsers.slice(0, 10);
      top10.forEach((user, index) => {
        const position = index + 1;
        const emoji = getPositionEmoji(position);
        const mention = formatMention(user.userId, user.name);
        const wins = user.wins;
        const winsText = wins === 1 ? 'vitória' : 'vitórias';
        groupMsg += `${emoji} <b>${position}.</b> ${mention} – ${wins} ${winsText}\n`;
      });
      
      if (sortedUsers.length > 10) {
        groupMsg += `\n<i>... e mais ${sortedUsers.length - 10} jogadores</i>\n`;
      }
    }
    groupMsg += '\n💡 <i>O ranking reseta todo dia à meia-noite!</i>';
    try {
      await sendMessageWithRetry(bot, group.id, groupMsg, { parse_mode: 'HTML' });
      console.log(`[SUCCESS] Ranking X1 enviado com sucesso para ${group.name}`);
      
      // Delay entre grupos para respeitar rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[ERROR] Falha ao enviar ranking X1 para o grupo ${group.name} (${group.id}):`, error.message);
    }
  }

  // Enviar ranking global para o grupo de logs
  const config = require('../../config/config');
  if (config.logGroup && config.logGroup.status && config.logGroup.id) {
    try {
      await sendMessageWithRetry(bot, config.logGroup.id, globalMsg, {
        parse_mode: 'HTML',
        message_thread_id: config.logGroup.topic || undefined
      });
      console.log('[SUCCESS] Ranking global X1 enviado para o grupo de logs');
    } catch (error) {
      console.error('[ERROR] Falha ao enviar ranking global X1 para o grupo de logs:', error.message);
    }
  }
  
  console.log('[INFO] Ranking de X1 concluído para todos os grupos ativos.');
};
