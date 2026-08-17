'use strict';

const {
  ensureUser,
  ensureBotGroup,
  getTopHelpersWithNames
} = require('../../utils/databaseUtilsMySQL');

module.exports = (bot) => {
  // ─── Comando: /guardioes ──────────────────────────────────────────────────────

  bot.command('guardioes', async (ctx) => {
    console.log('[DEBUG] /guardioes', { chatId: ctx.chat?.id });
    try {
      if (ctx.chat.type === 'private') {
        return ctx.reply('⚠️ O ranking de guardiões é exclusivo para grupos. Use este comando no seu grupo de colecionadores!');
      }

      await ensureUser(ctx.from.id.toString(), 1, {
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
      });
      const groupId = ctx.chat.id.toString();
      await ensureBotGroup(groupId, ctx.chat.title || 'Grupo');

      const helpers = await getTopHelpersWithNames(groupId, 10);

      if (helpers.length === 0) {
        return ctx.reply(
          '🛡️ <b>Guardiões dos Sprites</b>\n\n' +
          'Ainda não há registros de ajudas neste grupo.\n' +
          'Use <code>/agradecer</code> respondendo a quem te ajudou para começar a movimentar a comunidade!',
          { parse_mode: 'HTML' }
        );
      }

      let text = '🛡️ <b>Guardiões dos Sprites - Top Ajudantes</b>\n\n';
      const medals = ['🥇', '🥈', '🥉'];

      helpers.forEach((h, index) => {
        const medal = index < 3 ? medals[index] : '🏅';
        const name = h.first_name || h.username || 'Colecionador';
        text += `${medal} <b>${name}</b> — ${h.total_helped} ajuda(s)\n`;
      });

      return ctx.reply(text, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('[ERROR] /guardioes:', error.message);
      await ctx.reply('❌ Erro ao carregar o ranking de guardiões.');
    }
  });
};
