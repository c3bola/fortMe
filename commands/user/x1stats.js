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
      
      // Se é um novo dia, retorna dados vazios
      if (data.date !== today) {
        return { 
          date: today, 
          ranking: {},
          statistics: {
            totalDuels: 0,
            completedDuels: 0,
            abandonedDuels: 0,
            players: {}
          }
        };
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

// Função para formatar menção HTML
function formatMention(userId, name) {
  return `<a href="tg://user?id=${userId}">${name}</a>`;
}

module.exports = (bot) => {
  bot.command('x1stats', (ctx) => {
    try {
      const data = loadDailyRanking();
      const stats = data.statistics;
      
      // Verificar se há dados estatísticos
      if (stats.totalDuels === 0) {
        return ctx.reply(
          '📊 <b>Estatísticas de X1 do dia:</b>\n\n' +
          '🤷‍♂️ Nenhum duelo foi iniciado hoje ainda!\n' +
          '💥 Use /x1 em resposta à mensagem de alguém para começar as estatísticas!',
          { parse_mode: 'HTML' }
        );
      }
      
      // Calcular estatísticas gerais
      const completionRate = ((stats.completedDuels / stats.totalDuels) * 100).toFixed(1);
      const abandonmentRate = ((stats.abandonedDuels / stats.totalDuels) * 100).toFixed(1);
      
      let message = '📊 <b>Estatísticas de X1 do dia:</b>\n\n';
      
      // Estatísticas gerais
      message += '🎯 <b>Números Gerais:</b>\n';
      message += `• Total de duelos iniciados: <b>${stats.totalDuels}</b>\n`;
      message += `• Duelos concluídos: <b>${stats.completedDuels}</b> (${completionRate}%)\n`;
      message += `• Duelos abandonados: <b>${stats.abandonedDuels}</b> (${abandonmentRate}%)\n\n`;
      
      const players = stats.players;
      const playerIds = Object.keys(players);
      
      if (playerIds.length > 0) {
        // Jogador com mais vitórias
        const playersByWins = playerIds
          .map(id => ({ id, ...players[id] }))
          .sort((a, b) => b.wins - a.wins);
        
        if (playersByWins.length > 0 && playersByWins[0].wins > 0) {
          const topWinner = playersByWins[0];
          message += `🏆 <b>Campeão do dia:</b>\n`;
          message += `${formatMention(topWinner.id, topWinner.name)} – ${topWinner.wins} vitórias\n\n`;
        }
        
        // Jogador com mais fugas
        const playersByAbandons = playerIds
          .map(id => ({ id, ...players[id] }))
          .sort((a, b) => b.duelsAbandoned - a.duelsAbandoned);
        
        if (playersByAbandons.length > 0 && playersByAbandons[0].duelsAbandoned > 0) {
          const topFugitive = playersByAbandons[0];
          message += `🏃‍♂️ <b>Rei da fuga:</b>\n`;
          message += `${formatMention(topFugitive.id, topFugitive.name)} – ${topFugitive.duelsAbandoned} fugas\n\n`;
        }
        
        // Top 5 jogadores mais ativos
        const playersByActivity = playerIds
          .map(id => ({ id, ...players[id] }))
          .sort((a, b) => b.duelsStarted - a.duelsStarted)
          .slice(0, 5);
        
        if (playersByActivity.length > 0) {
          message += `⚡ <b>Top ${Math.min(5, playersByActivity.length)} mais ativos:</b>\n`;
          playersByActivity.forEach((player, index) => {
            const position = index + 1;
            const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏅';
            message += `${emoji} ${formatMention(player.id, player.name)} – ${player.duelsStarted} duelos\n`;
          });
          message += '\n';
        }
        
        // Estatísticas de participação
        const totalParticipations = playerIds.reduce((sum, id) => sum + players[id].duelsStarted, 0);
        const avgParticipation = (totalParticipations / playerIds.length).toFixed(1);
        
        message += `👥 <b>Participação:</b>\n`;
        message += `• Jogadores únicos: <b>${playerIds.length}</b>\n`;
        message += `• Média de duelos por jogador: <b>${avgParticipation}</b>\n\n`;
      }
      
      // Dicas e informações extras
      if (stats.completedDuels > 0) {
        message += `💡 <b>Dica:</b> `;
        if (completionRate >= 80) {
          message += `Excelente! ${completionRate}% dos duelos foram concluídos! 🎉`;
        } else if (completionRate >= 60) {
          message += `Boa participação! ${completionRate}% dos duelos foram concluídos! 👍`;
        } else {
          message += `Muitas fugas hoje! Apenas ${completionRate}% dos duelos foram concluídos. 😅`;
        }
      }
      
      message += `\n\n🔄 <i>As estatísticas resetam todo dia à meia-noite!</i>`;
      
      ctx.reply(message, { parse_mode: 'HTML' });
      
    } catch (error) {
      console.error('[ERROR] Erro no comando /x1stats:', error.message);
      ctx.reply('❌ Ocorreu um erro ao exibir as estatísticas. Tente novamente!');
    }
  });
};