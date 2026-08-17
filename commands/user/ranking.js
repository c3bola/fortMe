const {
  getDailyLoveHateRanking,
  getTryhardRanking,
  getX1TopRanking,
  getCollectionRankingWithNames
} = require('../../utils/databaseUtilsMySQL');

// Emojis de posição
function getPositionEmoji(position) {
  const emojis = {
    1: '🥇',
    2: '🥈', 
    3: '🥉'
  };
  return emojis[position] || '🏅';
}

// Formatar menção HTML
function formatMention(userId, name) {
  return `<a href="tg://user?id=${userId}">${name}</a>`;
}

module.exports = (bot) => {
  bot.command('ranking', async (ctx) => {
    try {
      // Apenas em grupos
      if (ctx.chat.type === 'private') {
        return ctx.reply('❌ Este comando só funciona em grupos!');
      }
      
      const groupId = ctx.chat.id;
      const args = ctx.message.text.split(' ');
      const feature = args[1] ? args[1].toLowerCase() : 'x1';
      
      let message = '';
      
      // Ranking de X1 (padrão)
      if (feature === 'x1') {
        const ranking = await getX1TopRanking(groupId, 10);
        
        if (ranking.length === 0) {
          return ctx.reply(
            '🏆 <b>Ranking de X1s:</b>\n\n' +
            '🤷‍♂️ Ninguém duelou ainda!\n' +
            '💥 Use /x1 em resposta à mensagem de alguém para começar!',
            { parse_mode: 'HTML' }
          );
        }
        
        message = '🏆 <b>Top 10 X1 do Grupo:</b>\n\n';
        
        ranking.forEach((user, index) => {
          const position = index + 1;
          const emoji = getPositionEmoji(position);
          const mention = formatMention(user.fk_id_user, user.username || `User${user.fk_id_user}`);
          const wins = user.wins;
          const winRate = parseFloat(user.win_rate).toFixed(1);
          
          message += `${emoji} <b>${position}.</b> ${mention} – ${wins} vitórias (${winRate}%)\n`;
        });
        
        if (ranking.length > 0) {
          const champion = ranking[0];
          if (champion.wins >= 10) {
            message += `\n👑 <b>LENDA DO X1!</b> 👑`;
          } else if (champion.wins >= 5) {
            message += `\n🔥 <b>DOMINANDO OS DUELOS!</b> 🔥`;
          }
        }
        
        message += '\n\n💡 <i>Use /ranking [tipo] para outros rankings:</i>';
        message += '\n• /ranking x1 - Top X1';
        message += '\n• /ranking fortme - Mais amado/odiado';
        message += '\n• /ranking fortgirl - Mais amada/odiada';
        message += '\n• /ranking jonesyme - Jonesy favorito/menos favorito';
        message += '\n• /ranking tryhard - Mais tryhard/banana';
        message += '\n• /ranking elementais - Top Colecionadores';
      }
      
      // Ranking FortMe (mais amado/odiado)
      else if (feature === 'fortme') {
        const ranking = await getDailyLoveHateRanking(groupId, 1); // feature_id 1
        
        if (!ranking.most_loved && !ranking.most_hated) {
          return ctx.reply(
            '💖 <b>Ranking FortMe:</b>\n\n' +
            '🤷‍♂️ Ninguém votou ainda hoje!\n' +
            'Use /fortme para começar!',
            { parse_mode: 'HTML' }
          );
        }
        
        message = '💖 <b>Ranking FortMe do Dia:</b>\n\n';
        
        if (ranking.most_loved) {
          const mention = formatMention(ranking.most_loved.user_id, ranking.most_loved.username || `User${ranking.most_loved.user_id}`);
          message += `💖 <b>MAIS AMADO:</b> ${mention}\n`;
          message += `   ${ranking.most_loved.heart_count} corações recebidos\n\n`;
        }
        
        if (ranking.most_hated) {
          const mention = formatMention(ranking.most_hated.user_id, ranking.most_hated.username || `User${ranking.most_hated.user_id}`);
          message += `🎩 <b>MAIS ODIADO:</b> ${mention}\n`;
          message += `   ${ranking.most_hated.hat_count} chapéus recebidos\n`;
        }
        
        message += '\n💡 <i>Ranking reseta todo dia!</i>';
      }
      
      // Ranking FortGirl
      else if (feature === 'fortgirl') {
        const ranking = await getDailyLoveHateRanking(groupId, 2); // feature_id 2
        
        if (!ranking.most_loved && !ranking.most_hated) {
          return ctx.reply(
            '💖 <b>Ranking FortGirl:</b>\n\n' +
            '🤷‍♂️ Ninguém votou ainda hoje!\n' +
            'Use /fortgirl para começar!',
            { parse_mode: 'HTML' }
          );
        }
        
        message = '💖 <b>Ranking FortGirl do Dia:</b>\n\n';
        
        if (ranking.most_loved) {
          const mention = formatMention(ranking.most_loved.user_id, ranking.most_loved.username || `User${ranking.most_loved.user_id}`);
          message += `💖 <b>MAIS AMADA:</b> ${mention}\n`;
          message += `   ${ranking.most_loved.heart_count} corações recebidos\n\n`;
        }
        
        if (ranking.most_hated) {
          const mention = formatMention(ranking.most_hated.user_id, ranking.most_hated.username || `User${ranking.most_hated.user_id}`);
          message += `🎩 <b>MAIS ODIADA:</b> ${mention}\n`;
          message += `   ${ranking.most_hated.hat_count} chapéus recebidos\n`;
        }
        
        message += '\n💡 <i>Ranking reseta todo dia!</i>';
      }
      
      // Ranking JonesyMe
      else if (feature === 'jonesyme') {
        const ranking = await getDailyLoveHateRanking(groupId, 3); // feature_id 3
        
        if (!ranking.most_loved && !ranking.most_hated) {
          return ctx.reply(
            '💖 <b>Ranking JonesyMe:</b>\n\n' +
            '🤷‍♂️ Ninguém votou ainda hoje!\n' +
            'Use /jonesyme para começar!',
            { parse_mode: 'HTML' }
          );
        }
        
        message = '💖 <b>Ranking JonesyMe do Dia:</b>\n\n';
        
        if (ranking.most_loved) {
          const mention = formatMention(ranking.most_loved.user_id, ranking.most_loved.username || `User${ranking.most_loved.user_id}`);
          message += `💖 <b>JONESY FAVORITO:</b> ${mention}\n`;
          message += `   ${ranking.most_loved.heart_count} corações recebidos\n\n`;
        }
        
        if (ranking.most_hated) {
          const mention = formatMention(ranking.most_hated.user_id, ranking.most_hated.username || `User${ranking.most_hated.user_id}`);
          message += `🎩 <b>JONESY MENOS FAVORITO:</b> ${mention}\n`;
          message += `   ${ranking.most_hated.hat_count} chapéus recebidos\n`;
        }
        
        message += '\n💡 <i>Ranking reseta todo dia!</i>';
      }
      
      // Ranking Tryhard
      else if (feature === 'tryhard' || feature === 'tryhardme') {
        const ranking = await getTryhardRanking(groupId);
        
        if (!ranking.most_tryhard && !ranking.most_banana) {
          return ctx.reply(
            '⛏️ <b>Ranking Tryhard:</b>\n\n' +
            '🤷‍♂️ Ninguém usou /tryhardme hoje!\n' +
            'Use /tryhardme para começar!',
            { parse_mode: 'HTML' }
          );
        }
        
        message = '⛏️ <b>Ranking Tryhard do Dia:</b>\n\n';
        
        if (ranking.most_tryhard) {
          const mention = formatMention(ranking.most_tryhard.user_id, ranking.most_tryhard.username || `User${ranking.most_tryhard.user_id}`);
          message += `🌟 <b>MAIS TRYHARD:</b> ${mention}\n`;
          message += `   ${ranking.most_tryhard.percentage}% tryhard!\n\n`;
        }
        
        if (ranking.most_banana) {
          const mention = formatMention(ranking.most_banana.user_id, ranking.most_banana.username || `User${ranking.most_banana.user_id}`);
          message += `🍌 <b>MAIS EMBANANADO:</b> ${mention}\n`;
          message += `   ${100 - ranking.most_banana.percentage}% banana!\n`;
        }
        
        message += '\n💡 <i>Ranking reseta todo dia!</i>';
      }// Ranking Elementais (Colecionadores)
      else if (feature === 'elementais' || feature === 'sprites') {
        const ranking = await getCollectionRankingWithNames(10);
        
        if (ranking.length === 0) {
          return ctx.reply(
            '📦 <b>Ranking de Colecionadores:</b>\n\n' +
            '🤷‍♂️ Ninguém começou uma coleção ainda!\n' +
            'Use /elementais para começar a coletar!',
            { parse_mode: 'HTML' }
          );
        }
        
        message = '📦 <b>Top 10 Colecionadores (Global):</b>\n\n';
        
        ranking.forEach((user, index) => {
          const position = index + 1;
          const emoji = getPositionEmoji(position);
          const name = user.first_name || user.username || `Colecionador`;
          const mention = formatMention(user.user_id, name);
          const total = user.total_variants;
          
          message += `${emoji} <b>${position}.</b> ${mention} – ${total} sprite(s)\n`;
        });
        
        message += '\n💡 <i>Dica: O ranking de colecionadores é global e mostra os maiores do bot inteiro!</i>';
      }
      
      else {
        message = '❌ <b>Tipo de ranking inválido!</b>\n\n';
        message += '<i>Rankings disponíveis:</i>\n';
        message += '• /ranking x1\n';
        message += '• /ranking fortme\n';
        message += '• /ranking fortgirl\n';
        message += '• /ranking jonesyme\n';
        message += '• /ranking tryhard\n';
        message += '• /ranking elementais';
      }
      
      ctx.reply(message, { parse_mode: 'HTML' });
      
    } catch (error) {
      console.error('[RANKING ERROR]', error);
      ctx.reply('❌ Erro ao exibir ranking!');
    }
  });
};