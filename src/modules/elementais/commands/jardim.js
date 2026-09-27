'use strict';

const jardimDb = require('../db/jardimDb');
const coverDb = require('../db/coverDb'); 
const { isAdmin } = require('../../../utils/databaseUtilsMySQL');
const { getEmoji } = require('../config');

function makeProgressBar(owned, total, size = 10) {
  if (total === 0) return '░'.repeat(size) + ` 0/0`;
  const filled = Math.round((owned / total) * size);
  const empty = size - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${owned}/${total}`;
}

module.exports = (bot) => {
  bot.command(['jardim', 'garden'], async (ctx) => {
    const replyId = ctx.message?.message_id;
    const userIdStr = ctx.from.id.toString();
    const userName = ctx.from.first_name;

    try {
      const statusMsg = await ctx.reply('⏳ <b>Analisando seu Jardim...</b>', { parse_mode: 'HTML', reply_to_message_id: replyId });

      const admin = await isAdmin(userIdStr);
      const subscriber = await coverDb.hasActiveSubscription(userIdStr);
      const isVip = admin || subscriber;

      const coverFileId = await coverDb.getEffectiveCover(userIdStr, isVip);
      
      const progress = await jardimDb.getUserSeasonsProgress(userIdStr);
      const activeMetrics = await jardimDb.getActiveSeasonMetrics(userIdStr);

      let caption = `Jardim dos elementais do: <b>${userName}</b>\n\n`;

      if (progress.length === 0) {
        caption += `<i>Nenhuma temporada registrada no momento.</i>\n\n`;
      } else {
        progress.forEach(p => {
          const medalEmoji = getEmoji(p.medalKey);
          const seasonCode = p.season.code;
          const progressBar = makeProgressBar(p.totalOwned, p.totalAvailable);
          
          caption += `${medalEmoji} ${seasonCode}: ${progressBar}\n`;
        });
      }

      caption += `\n`;

      if (activeMetrics) {
        caption += `<b>${userName}</b> conseguiu dominar ${activeMetrics.totalDominated} elementais e ajudar ${activeMetrics.totalHelped} pessoas na temporada ${activeMetrics.seasonName}\n\n`;
      }

      caption += `@Fortmebot\n\n`;

      if (!isVip) {
        caption += `<blockquote>Quer customizar a capa do seu Jardim? Entre agora no Clubinho Fortnite Brasil e customize a sua capa.</blockquote>`;
      }

      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});

      if (coverFileId) {
        await ctx.replyWithPhoto(coverFileId, {
          caption: caption.trim(),
          parse_mode: 'HTML',
          reply_to_message_id: replyId
        });
      } else {
        await ctx.reply(caption.trim(), {
          parse_mode: 'HTML',
          reply_to_message_id: replyId
        });
      }

    } catch (error) {
      console.error('[ERROR] /jardim:', error.message);
      await ctx.reply('❌ Ocorreu um erro ao carregar o seu Jardim.', { reply_to_message_id: replyId });
    }
  });
};