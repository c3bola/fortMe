'use strict';

const {
  ensureUser,
  ensureBotGroup,
  getUserCollectionProgress,
  getUserElementalConfig
} = require('../../utils/databaseUtilsMySQL');

const { buildProgressBar } = require('./elementalCommon');

module.exports = (bot) => {
  // ─── Comando: /perfil ─────────────────────────────────────────────────────────

  bot.command('perfil', async (ctx) => {
    const userId = ctx.from?.id?.toString();
    console.log('[DEBUG] /perfil', { userId });
    try {
      await ensureUser(ctx.from.id.toString(), 1, {
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
      });
      if (ctx.chat.type !== 'private') {
        await ensureBotGroup(ctx.chat.id.toString(), ctx.chat.title || 'Grupo');
      }

      const [progress, config] = await Promise.all([
        getUserCollectionProgress(userId),
        getUserElementalConfig(userId),
      ]);

      const name = ctx.from.first_name || 'Colecionador';
      const username = ctx.from.username ? `@${ctx.from.username}` : '';
      const bar = buildProgressBar(progress.total_owned, progress.total_available, 10);

      const helpStatus = config.accept_help_requests ? '✅ Aceita' : '❌ Recusa';
      const dmStatus = config.allow_private_messages ? '✅ Aceita' : '❌ Recusa';
      const mentionStatus = config.allow_group_mention ? '✅ Aceita' : '❌ Recusa';

      const text =
        `👤 <b>${name}</b>${username ? ' · ' + username : ''}\n\n` +
        '🃏 <b>Coleção</b>\n' +
        `${bar} <b>${progress.percentage}%</b>\n` +
        `${progress.total_owned} de ${progress.total_available} sprites coletados\n\n` +
        '⚙️ <b>Configurações</b>\n' +
        `Pedidos de ajuda: ${helpStatus}\n` +
        `Mensagens privadas: ${dmStatus}\n` +
        `Marcação no grupo: ${mentionStatus}\n\n` +
        '<i>Use /configsprites para alterar suas configurações.</i>';

      return ctx.reply(text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📦 Minha Coleção', callback_data: 'el_colecao' }],
            [{ text: '📊 Estatísticas', callback_data: 'el_stats' }],
            [{ text: '⚙️ Configurações', callback_data: 'el_config' }],
          ],
        },
      });
    } catch (error) {
      console.error('[ERROR] /perfil:', error.message);
      await ctx.reply('❌ Erro ao carregar perfil. Tente novamente.');
    }
  });

  bot.action(/^el_perfil$/, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    try {
      await ctx.answerCbQuery();
      const [progress, config] = await Promise.all([
        getUserCollectionProgress(userId),
        getUserElementalConfig(userId),
      ]);

      const name = ctx.from.first_name || 'Colecionador';
      const username = ctx.from.username ? `@${ctx.from.username}` : '';
      const bar = buildProgressBar(progress.total_owned, progress.total_available, 10);

      const helpStatus = config.accept_help_requests ? '✅ Aceita' : '❌ Recusa';
      const dmStatus = config.allow_private_messages ? '✅ Aceita' : '❌ Recusa';
      const mentionStatus = config.allow_group_mention ? '✅ Aceita' : '❌ Recusa';

      const text =
        `👤 <b>${name}</b>${username ? ' · ' + username : ''}\n\n` +
        '🃏 <b>Coleção</b>\n' +
        `${bar} <b>${progress.percentage}%</b>\n` +
        `${progress.total_owned} de ${progress.total_available} sprites coletados\n\n` +
        '⚙️ <b>Configurações</b>\n' +
        `Pedidos de ajuda: ${helpStatus}\n` +
        `Mensagens privadas: ${dmStatus}\n` +
        `Marcação no grupo: ${mentionStatus}`;

      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📦 Minha Coleção', callback_data: 'el_colecao' }],
            [{ text: '📊 Estatísticas', callback_data: 'el_stats' }],
            [{ text: '⚙️ Configurações', callback_data: 'el_config' }],
          ],
        },
      });
    } catch (error) {
      console.error('[ERROR] el_perfil:', error.message);
      await ctx.answerCbQuery('❌ Erro ao carregar perfil.', { show_alert: true });
    }
  });
};
