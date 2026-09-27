'use strict';

const catalogDb = require('../db/catalogDb');
const imageService = require('../services/imageService');
const { isAdmin } = require('../../../utils/databaseUtilsMySQL');
const path = require('path');
const fs = require('fs');
const SRC_DIR = path.join(__dirname, '../../../../');
const IMAGES_BASE = path.join(SRC_DIR, 'assets/images');

module.exports = (bot) => {
  bot.command('buildcards', async (ctx) => {
    const replyId = ctx.message?.message_id;

    try {
      if (!(await isAdmin(ctx.from.id))) {
        return ctx.reply('❌ Apenas administradores podem compilar cartas.', { reply_to_message_id: replyId });
      }

      const args = ctx.message.text.toLowerCase().split(/\s+/).slice(1);
      const isForce = args.includes('force');
      const targetCategory = args.find(arg => arg !== 'force');

      let variants = await catalogDb.getAllVariants();
      if (variants.length === 0) {
        return ctx.reply('❌ Nenhuma variante encontrada.', { reply_to_message_id: replyId });
      }

      if (targetCategory) {
        variants = variants.filter(v => 
          v.category_code.toLowerCase() === targetCategory || 
          v.category_name.toLowerCase() === targetCategory
        );
      }

      const statusMsg = await ctx.reply(
        `⏳ <b>Iniciando compilação em lote...</b>\n\nTotal de cartas a verificar: <b>${variants.length}</b>`, 
        { parse_mode: 'HTML', reply_to_message_id: replyId }
      );

      // Executa a tarefa desacoplada do ciclo de vida do Telegraf para não bater o timeout de 90s
      (async () => {
        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const startTime = Date.now();
        const total = variants.length;

        for (let i = 0; i < total; i++) {
          const variant = variants[i];
          const sourceFilename = variant.image ? path.basename(variant.image) : `${variant.slug}_${variant.category_code}.png`;
          const expectedOutputPath = path.join(IMAGES_BASE, 'elementais', sourceFilename);

          if (!isForce && fs.existsSync(expectedOutputPath)) {
            skippedCount++;
            continue;
          }

          try {
            const finalPath = await imageService.buildIndividualCard(
              variant.sprite_name, 
              variant.category_code, 
              variant.category_name, 
              sourceFilename
            );

            if (!variant.image) {
              await catalogDb.updateVariantImage(variant.id_elemental_variant, `elementais/${path.basename(finalPath)}`);
            }
            successCount++;
          } catch (e) {
            console.error(`[BUILD ERROR] ${variant.sprite_name}: ${e.message}`);
            errorCount++;
          }

          // Atualiza o progresso no Telegram a cada 20 cartas processadas
          if ((i + 1) % 20 === 0 || (i + 1) === total) {
            await ctx.telegram.editMessageText(
              ctx.chat.id, 
              statusMsg.message_id, 
              undefined, 
              `⏳ <b>Compilando cartas...</b>\n\n` +
              `Progresso: <b>${i + 1}/${total}</b>\n` +
              `✨ Geradas: ${successCount} | ⏭️ Ignoradas: ${skippedCount}`,
              { parse_mode: 'HTML' }
            ).catch(() => {});
          }
        }

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
        await ctx.telegram.editMessageText(
          ctx.chat.id, 
          statusMsg.message_id, 
          undefined, 
          `✅ <b>Compilação Concluída!</b>\n\n` +
          `⏱️ <b>Tempo:</b> ${timeTaken}s\n` +
          `✨ <b>Geradas:</b> ${successCount}\n` +
          `⏭️ <b>Ignoradas:</b> ${skippedCount}\n` +
          `❌ <b>Erros:</b> ${errorCount}`,
          { parse_mode: 'HTML' }
        ).catch(() => {});
      })();

    } catch (error) {
      console.error('[ERROR] /buildcards:', error.message);
      await ctx.reply('❌ Erro crítico ao iniciar compilação.', { reply_to_message_id: replyId });
    }
  });
};