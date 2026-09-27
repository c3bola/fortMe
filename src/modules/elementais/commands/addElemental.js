'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const { isAdmin } = require('../../../utils/databaseUtilsMySQL');
const catalogDb = require('../db/catalogDb');
const seasonDb = require('../db/seasonDb');
const imageService = require('../services/imageService');

const IMAGES_BASE = path.join(__dirname, '../../../assets/images');
const LOG_GROUP_ID = process.env.LOG_GROUP_ID || process.env.GROUP_LOGS_ID;

// Map para o fluxo Gerar Novamente | Cancelar
const pendingUpdates = new Map();

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) return reject(new Error(`Status ${response.statusCode}`));
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

module.exports = (bot) => {
  bot.command(['addelemental', 'setelemental'], async (ctx) => {
    const replyId = ctx.message?.message_id;
    const userIdStr = ctx.from?.id?.toString();

    try {
      if (!(await isAdmin(userIdStr))) {
        return ctx.reply('❌ Apenas administradores podem adicionar elementais.', { reply_to_message_id: replyId });
      }

      const repliedMessage = ctx.message.reply_to_message;
      
      const hasPhoto = repliedMessage && repliedMessage.photo && repliedMessage.photo.length > 0;
      const hasDocument = repliedMessage && repliedMessage.document;
      const hasMedia = hasPhoto || hasDocument;
      
      const rawText = hasMedia ? (repliedMessage.caption || '') : '';

      if (!hasMedia || !rawText.includes('Nome:')) {
        return ctx.reply(
          '📝 <b>Como registrar um novo Elemental:</b>\n\n' +
          '1. Envie a imagem do sprite (preferencialmente como <b>ARQUIVO</b> para manter a transparência) com a legenda estruturada:\n' +
          '<code>Nome: Moita\nCategoria: Básico\nLocal: No chão\nCusto: 0\nChance: 0\nDica: Gera um Arbusto...</code>\n\n' +
          '2. <b>Responda</b> a essa mensagem com o comando: <code>/addelemental</code>',
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      const statusMsg = await ctx.reply('⏳ Analisando dados...', { reply_to_message_id: replyId });

      const nomeMatch = rawText.match(/Nome:\s*(.+)/i);
      const catMatch = rawText.match(/Categoria:\s*(.+)/i);
      const localMatch = rawText.match(/Local:\s*(.+)/i);
      const custoMatch = rawText.match(/Custo:\s*(\d+)/i);
      const chanceMatch = rawText.match(/Chance:\s*([\d.]+)/i);
      const dicaMatch = rawText.match(/Dica:\s*(.+)/i);

      if (!nomeMatch || !catMatch || !localMatch || !custoMatch || !chanceMatch) {
        return ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, undefined, '❌ <b>Legenda mal formatada.</b>', { parse_mode: 'HTML' });
      }

      const name = nomeMatch[1].trim();
      const catInput = catMatch[1].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const location = localMatch[1].trim();
      const cost = parseInt(custoMatch[1]);
      const chance = parseFloat(chanceMatch[1]);
      const description = dicaMatch ? dicaMatch[1].trim() : '';
      const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');

      const categories = await catalogDb.getAllCategories();
      const category = categories.find(c => {
        const dbCode = (c.code || '').toLowerCase().trim();
        const dbName = (c.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        return dbCode === catInput || dbName === catInput;
      });

      if (!category) return ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, undefined, `❌ Categoria <b>${catMatch[1].trim()}</b> não encontrada.`, { parse_mode: 'HTML' });

      let sprite = await catalogDb.getSpriteBySlug(slug);
      let existingVariant = null;
      if (sprite) {
        const variants = await catalogDb.getVariantsBySpriteId(sprite.id_elemental_sprite);
        existingVariant = variants.find(v => v.fk_id_category === category.id_elemental_category);
      }

      let targetFileId;
      if (hasDocument) {
        targetFileId = repliedMessage.document.file_id;
      } else {
        targetFileId = repliedMessage.photo[repliedMessage.photo.length - 1].file_id;
      }

      const fileLink = await ctx.telegram.getFileLink(targetFileId);
      const rawFileName = `${slug}_${category.code}.png`;
      const originalPath = path.join(IMAGES_BASE, 'sprite_original', rawFileName);
      
      if (!fs.existsSync(path.dirname(originalPath))) fs.mkdirSync(path.dirname(originalPath), { recursive: true });
      await downloadFile(fileLink.href, originalPath);

      if (existingVariant) {
        const pendingId = Date.now().toString();
        pendingUpdates.set(pendingId, {
          spriteId: sprite.id_elemental_sprite, variantId: existingVariant.id_elemental_variant,
          name, location, cost, chance, description, slug, category, rawFileName
        });

        const caption = `⚠️ <b>Elemental já cadastrado!</b>\n\n• <b>Personagem:</b> ${sprite.name}\n• <b>Categoria:</b> ${category.name}\n\nO que deseja fazer?`;
        const keyboard = { inline_keyboard: [
          [{ text: '🔄 Gerar Novamente (Substituir Arte)', callback_data: `adm_el_rg_${pendingId}` }],
          [{ text: '❌ Cancelar', callback_data: `adm_el_cx_${pendingId}` }]
        ]};

        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(()=>{});

        let cardPath = existingVariant.image ? path.join(IMAGES_BASE, path.basename(existingVariant.image)) : null;
        if (existingVariant.telegram_file_id) {
           return ctx.replyWithPhoto(existingVariant.telegram_file_id, { caption, parse_mode: 'HTML', reply_markup: keyboard, reply_to_message_id: replyId });
        } else if (cardPath && fs.existsSync(cardPath)) {
           return ctx.replyWithPhoto({ source: fs.createReadStream(cardPath) }, { caption, parse_mode: 'HTML', reply_markup: keyboard, reply_to_message_id: replyId });
        } else {
           return ctx.reply(caption + '\n\n<i>Arte atual não encontrada no servidor local.</i>', { parse_mode: 'HTML', reply_markup: keyboard, reply_to_message_id: replyId });
        }
      }

      await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, undefined, '⏳ Gravando banco de dados e compilando Card final...', { parse_mode: 'HTML' });

      if (!sprite) {
        const insertId = await catalogDb.createSprite(slug, name, description);
        sprite = { id_elemental_sprite: insertId, name, slug };
      }

      const outputFilename = `${slug}_${category.code}.png`;
      const compiledCardPath = await imageService.buildIndividualCard(name, category.code, category.name, rawFileName, outputFilename);

      const finalRelativePath = `elementais/${outputFilename}`;
      const variantId = await catalogDb.createVariant(sprite.id_elemental_sprite, category.id_elemental_category, location, cost, chance, finalRelativePath);

      let currentSeason = await seasonDb.getCurrentSeason();
      if (currentSeason) await seasonDb.linkVariantToSeason(currentSeason.id_season, variantId, 1);

      await finishAddFlow(ctx, variantId, sprite, category, currentSeason, cost, chance, compiledCardPath, name, statusMsg.message_id);

    } catch (error) {
      console.error('[ERROR] /addelemental:', error.message);
      await ctx.reply(`❌ Erro crítico: ${error.message}`, { reply_to_message_id: replyId });
    }
  });

  bot.action(/^adm_el_rg_(\d+)$/, async (ctx) => {
    const pendingId = ctx.match[1];
    const data = pendingUpdates.get(pendingId);
    
    if (!data) return ctx.answerCbQuery('❌ Sessão expirada.', { show_alert: true });
    pendingUpdates.delete(pendingId);

    try {
      await ctx.answerCbQuery('⏳ Regerando arte...');
      await ctx.editMessageCaption('⏳ <b>Substituindo arte e atualizando dados no banco...</b>', { parse_mode: 'HTML' }).catch(()=>{});

      const outputFilename = `${data.slug}_${data.category.code}.png`;
      const compiledCardPath = await imageService.buildIndividualCard(data.name, data.category.code, data.category.name, data.rawFileName, outputFilename);
      const finalRelativePath = `elementais/${outputFilename}`;

      await catalogDb.updateVariantData(data.variantId, data.location, data.cost, data.chance, finalRelativePath);
      await catalogDb.updateSpriteDescription(data.spriteId, data.description);

      await ctx.deleteMessage().catch(()=>{});
      let currentSeason = await seasonDb.getCurrentSeason();
      await finishAddFlow(ctx, data.variantId, { id_elemental_sprite: data.spriteId, name: data.name }, data.category, currentSeason, data.cost, data.chance, compiledCardPath, data.name, null);

    } catch (err) {
      console.error('[ERRO REGEN]', err);
      await ctx.reply('❌ Falha ao regerar elemental.');
    }
  });

  bot.action(/^adm_el_cx_(\d+)$/, async (ctx) => {
    const pendingId = ctx.match[1];
    const data = pendingUpdates.get(pendingId);
    if (data) {
       fs.unlink(path.join(IMAGES_BASE, 'sprite_original', data.rawFileName), () => {});
       pendingUpdates.delete(pendingId);
    }
    await ctx.answerCbQuery('Operação cancelada.');
    await ctx.deleteMessage().catch(()=>{});
  });

  bot.action(/^adm_el_logtog_(\d+)$/, async (ctx) => {
    const variantId = parseInt(ctx.match[1]);
    try {
      if (!(await isAdmin(ctx.from?.id?.toString()))) return ctx.answerCbQuery('❌ Apenas admins.', { show_alert: true });

      const newStatus = await seasonDb.toggleSeasonVariantStatus(variantId);
      const statusText = newStatus === 1 ? '✅ Ativo' : '❌ Inativo';
      const keyboard = { inline_keyboard: [[ { text: 'Visibilidade', callback_data: 'noop' }, { text: statusText, callback_data: `adm_el_logtog_${variantId}` } ]] };

      await ctx.editMessageReplyMarkup(keyboard).catch(()=>{});
      await ctx.answerCbQuery(`Status alterado para: ${statusText}`);

    } catch (error) {
      console.error('[LOG_TOGGLE]', error);
      await ctx.answerCbQuery('❌ Falha ao atualizar status.', { show_alert: true });
    }
  });

  async function finishAddFlow(ctx, variantId, sprite, category, currentSeason, cost, chance, compiledCardPath, name, msgIdToEdit) {
      const isActive = true; // A variante acabou de ser vinculada
      const statusText = isActive ? '✅ Ativo' : '❌ Inativo';

      const logKeyboard = {
        inline_keyboard: [[
          { text: 'Visibilidade', callback_data: 'noop' },
          { text: statusText, callback_data: `adm_el_logtog_${variantId}` }
        ]]
      };

      if (LOG_GROUP_ID && compiledCardPath && fs.existsSync(compiledCardPath)) {
        try {
          const logCaption = `📊 <b>Novo Elemental / Atualizado</b>\n\n👤 <b>Nome:</b> ${name}\n📂 <b>Categoria:</b> ${category.name}\n⏱ <b>Horário:</b> ${new Date().toLocaleString('pt-BR')}`;
          
          const logMsg = await ctx.telegram.sendPhoto(LOG_GROUP_ID, { source: compiledCardPath }, { caption: logCaption, parse_mode: 'HTML', reply_markup: logKeyboard });
          
          if (logMsg && logMsg.photo && logMsg.photo.length > 0) {
            const bestPhoto = logMsg.photo[logMsg.photo.length - 1];
            await catalogDb.updateVariantCache(variantId, bestPhoto.file_id, bestPhoto.file_unique_id);
          }
        } catch (logErr) {
          console.error('[ERROR] Falha ao enviar log para o grupo:', logErr.message);
        }
      }

      const successText = `✅ <b>Elemental Processado com Sucesso!</b>\n\n• <b>Personagem:</b> ${sprite.name}\n• <b>Categoria:</b> ${category.name}\n• <b>Temporada:</b> ${currentSeason ? currentSeason.name : 'Nenhuma'}\n• <b>Custo:</b> ${cost} | <b>Chance:</b> ${chance}%\n\n<i>O card foi gerado e salvo em disco.</i>`;

      if (msgIdToEdit) {
         await ctx.telegram.editMessageText(ctx.chat.id, msgIdToEdit, undefined, successText, { parse_mode: 'HTML' });
      } else {
         await ctx.reply(successText, { parse_mode: 'HTML' });
      }
  }
};