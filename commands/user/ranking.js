const fs = require('fs');
const path = require('path');

// Caminho para o banco de dados de ranking diário
const dailyRankingPath = path.join(__dirname, '../../database/dailyx1.json');

// Função para carregar ranking diário
function loadDailyRanking() {
  try {
    if (fs.existsSync(dailyRankingPath)) {
      const data = JSON.parse(fs.readFileSync(dailyRankingPath, 'utf8'));
      const today = new Date().toDateString();
      
      // Se é um novo dia, retorna ranking vazio
      if (data.date !== today) {
        return { date: today, ranking: {} };
      }
      return data;
    } else {
      return { date: new Date().toDateString(), ranking: {} };
    }
  } catch (error) {
    console.error('[ERROR] Erro ao carregar ranking diário:', error.message);
    return { date: new Date().toDateString(), ranking: {} };
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

module.exports = (bot) => {
  bot.command('ranking', (ctx) => {
    try {
      const data = loadDailyRanking();
      const ranking = data.ranking;
      
      // Verificar se há dados no ranking
      if (Object.keys(ranking).length === 0) {
        return ctx.reply(
          '📊 <b>Ranking de X1s do dia:</b>\n\n' +
          '🤷‍♂️ Ninguém duelou hoje ainda!\n' +
          '💥 Use /x1 em resposta à mensagem de alguém para começar os duelos!',
          { parse_mode: 'HTML' }
        );
      }
      
      // Ordenar usuários por número de vitórias
      const sortedUsers = Object.entries(ranking)
        .map(([userId, userData]) => ({
          userId: parseInt(userId),
          name: userData.name,
          wins: userData.wins
        }))
        .sort((a, b) => b.wins - a.wins);
      
      // Construir mensagem do ranking
      let message = '🏆 <b>Ranking de X1s do dia:</b>\n\n';
      
      sortedUsers.forEach((user, index) => {
        const position = index + 1;
        const emoji = getPositionEmoji(position);
        const mention = formatMention(user.userId, user.name);
        const wins = user.wins;
        const winsText = wins === 1 ? 'vitória' : 'vitórias';
        
        message += `${emoji} <b>${position}.</b> ${mention} – ${wins} ${winsText}\n`;
      });
      
      // Adicionar informações extras
      const totalDuels = sortedUsers.reduce((sum, user) => sum + user.wins, 0);
      message += `\n📈 <b>Total de duelos hoje:</b> ${totalDuels}`;
      
      // Adicionar emoji de campeão para o primeiro lugar
      if (sortedUsers.length > 0) {
        const champion = sortedUsers[0];
        if (champion.wins >= 5) {
          message += `\n👑 ${formatMention(champion.userId, champion.name)} é o <b>CAMPEÃO DO DIA</b>! 👑`;
        } else if (champion.wins >= 3) {
          message += `\n🔥 ${formatMention(champion.userId, champion.name)} está dominando! 🔥`;
        }
      }
      
      message += '\n\n💡 <i>O ranking reseta todo dia à meia-noite!</i>';
      
      ctx.reply(message, { parse_mode: 'HTML' });
      
    } catch (error) {
      console.error('[ERROR] Erro no comando /ranking:', error.message);
      ctx.reply('❌ Ocorreu um erro ao exibir o ranking. Tente novamente!');
    }
  });
};