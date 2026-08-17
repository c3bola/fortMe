'use strict';

const {
  ensureUser,
  ensureBotGroup,
  getElementalCategories,
  getVariantsByCategory,
  getUserCollectionIds,
  getUserCollectionProgress
} = require('../../utils/databaseUtilsMySQL');

const {
  catEmoji,
  buildProgressBar
} = require('./elementalCommon');

module.exports = (bot) => {
  // ─── Comando: /estatisticas ────────────────────────────────────────────────────

  bot.command('estatisticas', async (ctx) => {
    const userId = ctx.from?.id?.toString();
    console.log('[DEBUG] /estatisticas', { userId });
    try {
      await ensureUser(ctx.from.id.toString(), 1, {
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
      });
      if (ctx.chat.type !== 'private') {
        await ensureBotGroup(ctx.chat.id.toString(), ctx.chat.title || 'Grupo');
      }

      const [progress, categories, ownedIds] = await Promise.all([
        getUserCollectionProgress(userId),
        getElementalCategories(),
        getUserCollectionIds(userId),
      ]);

      const bar = buildProgressBar(progress.total_owned, progress.total_available, 10);

      const categoryLines = [];
      for (const cat of categories) {
        const variants = await getVariantsByCategory(cat.id_elemental_category);
        const owned = variants.filter(v => ownedIds.has(v.id_elemental_variant)).length;
        const total = variants.length;
        const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
        categoryLines.push(`${catEmoji(cat.code)} ${cat.name}: ${owned}/${total} (${pct}%)`);
      }

      const text =
        '📊 <b>Estatísticas da Coleção</b>\n\n' +
        `🃏 Progresso geral: ${bar} <b>${progress.percentage}%</b>\n` +
        `📦 ${progress.total_owned} de ${progress.total_available} sprite(s) coletado(s)\n\n` +
        '<b>Por categoria:</b>\n' +
        categoryLines.join('\n');

      return ctx.reply(text, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('[ERROR] /estatisticas:', error.message);
      await ctx.reply('❌ Erro ao carregar estatísticas. Tente novamente.');
    }
  });

  bot.action(/^el_stats$/, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    try {
      await ctx.answerCbQuery();
      const [progress, categories, ownedIds] = await Promise.all([
        getUserCollectionProgress(userId),
        getElementalCategories(),
        getUserCollectionIds(userId),
      ]);

      const bar = buildProgressBar(progress.total_owned, progress.total_available, 10);

      const categoryLines = [];
      for (const cat of categories) {
        const variants = await getVariantsByCategory(cat.id_elemental_category);
        const owned = variants.filter(v => ownedIds.has(v.id_elemental_variant)).length;
        const total = variants.length;
        const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
        categoryLines.push(`${catEmoji(cat.code)} ${cat.name}: ${owned}/${total} (${pct}%)`);
      }

      const text =
        '📊 <b>Estatísticas da Coleção</b>\n\n' +
        `🃏 Progresso geral: ${bar} <b>${progress.percentage}%</b>\n` +
        `📦 ${progress.total_owned} de ${progress.total_available} sprite(s) coletado(s)\n\n` +
        '<b>Por categoria:</b>\n' +
        categoryLines.join('\n');

      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: '⬅️ Voltar ao Perfil', callback_data: 'el_perfil' }]] },
      });
    } catch (error) {
      console.error('[ERROR] el_stats:', error.message);
      await ctx.answerCbQuery('❌ Erro ao carregar estatísticas.', { show_alert: true });
    }
  });
};
