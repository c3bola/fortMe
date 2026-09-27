'use strict';

const { ensureUser } = require('../../../utils/databaseUtilsMySQL');
const socialDb = require('../db/socialDb');
const uiService = require('../services/uiService');

module.exports = (bot) => {
  // ─── Comando: /configsprites ──────────────────────────────────────────────────

  bot.command('configsprites', async (ctx) => {
    const userId = ctx.from?.id?.toString();
    console.log('[DEBUG] /configsprites', { userId });
    try {
      await ensureUser(ctx.from.id.toString(), 1, {
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
      });

      const config = await socialDb.getUserElementalConfig(userId);
      return uiService.sendConfigMenu(ctx, config, false);
    } catch (error) {
      console.error('[ERROR] /configsprites:', error.message);
      await ctx.reply('❌ Erro ao carregar configurações. Tente novamente.');
    }
  });

  bot.action(/^el_config$/, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    try {
      await ctx.answerCbQuery();
      const config = await socialDb.getUserElementalConfig(userId);
      await uiService.sendConfigMenu(ctx, config, true);
    } catch (error) {
      console.error('[ERROR] el_config:', error.message);
      await ctx.answerCbQuery('❌ Erro ao carregar configurações.', { show_alert: true });
    }
  });

  // ─── Callbacks de configuração — toggles individuais ──────────────────────────

  bot.action(/^el_cfg_(help|dm|mention)$/, async (ctx) => {
    const field = ctx.match[1];
    const userId = ctx.from?.id?.toString();
    console.log('[DEBUG] el_cfg', { field, userId });
    try {
      await ctx.answerCbQuery();

      const config = await socialDb.getUserElementalConfig(userId);

      const fieldMap = {
        help: 'accept_help_requests',
        dm: 'allow_private_messages',
        mention: 'allow_group_mention',
      };
      const dbField = fieldMap[field];
      const newValue = config[dbField] ? 0 : 1;

      await socialDb.updateUserElementalConfig(userId, { [dbField]: newValue });

      const updated = { ...config, [dbField]: newValue };
      await uiService.sendConfigMenu(ctx, updated, true);
    } catch (error) {
      console.error('[ERROR] el_cfg:', error.message);
      await ctx.answerCbQuery('❌ Erro ao atualizar configuração.', { show_alert: true });
    }
  });
};