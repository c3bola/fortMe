'use strict';

const {
  ensureUser,
  ensureBotGroup,
  getRecentActivity
} = require('../../utils/databaseUtilsMySQL');

module.exports = (bot) => {
  // ─── Comando: /diario ─────────────────────────────────────────────────────────

  bot.command('diario', async (ctx) => {
    console.log('[DEBUG] /diario', { chatId: ctx.chat?.id });
    try {
      if (ctx.chat.type === 'private') {
        return ctx.reply('⚠️ O diário de atividades é exclusivo para grupos. Use este comando no seu grupo de colecionadores!');
      }

      await ensureUser(ctx.from.id.toString(), 1, {
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
      });
      const groupId = ctx.chat.id.toString();
      await ensureBotGroup(groupId, ctx.chat.title || 'Grupo');

      const activities = await getRecentActivity(groupId, 10);

      if (activities.length === 0) {
        return ctx.reply(
          '📰 <b>Diário da Comunidade</b>\n\n' +
          'Nenhuma atividade recente encontrada.\n' +
          'As marcações de sprites dos membros ativos do grupo aparecerão aqui!',
          { parse_mode: 'HTML' }
        );
      }

      let text = '📰 <b>Diário da Comunidade - Últimas Marcações</b>\n\n';

      activities.forEach(a => {
        const time = new Date(a.marked_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        text += `• [${time}] <a href="tg://user?id=${a.user_id}">Colecionador</a> obteve <b>${a.sprite_name}</b> (<i>${a.category_name}</i>)\n`;
      });

      return ctx.reply(text, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('[ERROR] /diario:', error.message);
      await ctx.reply('❌ Erro ao carregar o diário da comunidade.');
    }
  });
};
