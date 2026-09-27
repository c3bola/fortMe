'use strict';

const coverDb = require('../db/coverDb');
const { isAdmin } = require('../../../utils/databaseUtilsMySQL');

async function renderCoverFrame(ctx, index, userId, isNewMessage, adminMode) {
  const covers = await coverDb.getAllCovers();
  
  if (covers.length === 0) {
    const msg = '❌ Nenhuma capa predefinida encontrada no sistema.';
    return isNewMessage ? ctx.reply(msg) : ctx.answerCbQuery(msg, { show_alert: true });
  }

  if (index < 0) index = 0;
  if (index >= covers.length) index = covers.length - 1;

  const cover = covers[index];
  const maxIdx = covers.length - 1;
  const prevIdx = index > 0 ? index - 1 : 0;
  const nextIdx = index < maxIdx ? index + 1 : maxIdx;

  const navRow = [
    { text: '⏮️', callback_data: index === 0 ? 'noop' : `el_cnav_0` },
    { text: '◀️', callback_data: index === 0 ? 'noop' : `el_cnav_${prevIdx}` },
    { text: `${index + 1} / ${covers.length}`, callback_data: 'noop' },
    { text: '▶️', callback_data: index === maxIdx ? 'noop' : `el_cnav_${nextIdx}` },
    { text: '⏭️', callback_data: index === maxIdx ? 'noop' : `el_cnav_${maxIdx}` }
  ];

  const keyboard = { inline_keyboard: [navRow] };
  
  keyboard.inline_keyboard.push([{ text: '✅ Definir', callback_data: `el_cset_${cover.id_cover}` }]);

  if (adminMode) {
    keyboard.inline_keyboard.push([{ text: '🌟 Definir como padrão', callback_data: `el_cdef_${cover.id_cover}` }]);
  }
  
  keyboard.inline_keyboard.push([{ text: '🗑️ Fechar', callback_data: 'el_close' }]);

  const caption = 
    `🖼️ <b>Galeria de Capas</b>\n\n` +
    `<b>Nome:</b> ${cover.name}\n` +
    (cover.is_default ? `<i>(Capa Padrão Global)</i>\n\n` : `\n`) +
    `<blockquote>Você pode definir uma capa personalizada usando o mesmo comando e respondendo uma imagem.</blockquote>`;

  if (isNewMessage) {
    await ctx.replyWithPhoto(cover.file_id, { caption, parse_mode: 'HTML', reply_markup: keyboard });
  } else {
    await ctx.editMessageMedia(
      { type: 'photo', media: cover.file_id, caption: caption, parse_mode: 'HTML' },
      { reply_markup: keyboard }
    ).catch(() => {});
  }
}

module.exports = (bot) => {
  bot.command('addcapa', async (ctx) => {
    const replyId = ctx.message?.message_id;
    const userIdStr = ctx.from.id.toString();

    try {
      const admin = await isAdmin(userIdStr);
      const isSubscriber = await coverDb.hasActiveSubscription(userIdStr);

      if (!admin && !isSubscriber) {
        return ctx.reply('❌ <b>Acesso Negado</b>\n\nA customização da capa do Jardim é exclusiva para membros do Clubinho Fortnite Brasil.', { parse_mode: 'HTML', reply_to_message_id: replyId });
      }

      const repliedMsg = ctx.message.reply_to_message;

      if (repliedMsg && repliedMsg.photo) {
        const photo = repliedMsg.photo[repliedMsg.photo.length - 1];
        await coverDb.setUserCustomCover(userIdStr, photo.file_id);
        return ctx.reply('✅ <b>Capa personalizada salva!</b>\n\nUse /jardim para ver como ficou.', { parse_mode: 'HTML', reply_to_message_id: replyId });
      }

      await renderCoverFrame(ctx, 0, userIdStr, true, admin);

    } catch (error) {
      console.error('[ERROR] /addcapa:', error.message);
      await ctx.reply('❌ Ocorreu um erro ao processar o comando.', { reply_to_message_id: replyId });
    }
  });

  bot.command('addcapaglobal', async (ctx) => {
    const replyId = ctx.message?.message_id;
    try {
      if (!(await isAdmin(ctx.from.id.toString()))) return;

      const repliedMsg = ctx.message.reply_to_message;
      if (!repliedMsg || !repliedMsg.photo) {
        return ctx.reply('⚠️ Responda a uma imagem usando `/addcapaglobal [Nome da Capa]` para adicionar à galeria.', { parse_mode: 'Markdown', reply_to_message_id: replyId });
      }

      const coverName = ctx.message.text.replace('/addcapaglobal', '').trim() || 'Capa Sem Nome';
      const photo = repliedMsg.photo[repliedMsg.photo.length - 1];

      await coverDb.addGlobalCover(photo.file_id, coverName);
      await ctx.reply(`✅ Capa global <b>${coverName}</b> adicionada à galeria!`, { parse_mode: 'HTML', reply_to_message_id: replyId });
    } catch (error) {
      console.error('[ERROR] /addcapaglobal:', error.message);
    }
  });

  bot.action(/^el_cnav_(\d+)$/, async (ctx) => {
    const index = parseInt(ctx.match[1]);
    const userIdStr = ctx.from.id.toString();
    try {
      await ctx.answerCbQuery();
      const admin = await isAdmin(userIdStr);
      await renderCoverFrame(ctx, index, userIdStr, false, admin);
    } catch (error) {}
  });

  bot.action(/^el_cset_(\d+)$/, async (ctx) => {
    const coverId = parseInt(ctx.match[1]);
    const userIdStr = ctx.from.id.toString();
    try {
      const covers = await coverDb.getAllCovers();
      const cover = covers.find(c => c.id_cover === coverId);
      
      if (cover) {
        await coverDb.setUserCustomCover(userIdStr, cover.file_id);
        await ctx.answerCbQuery('✅ Capa do Jardim atualizada com sucesso!', { show_alert: true });
      } else {
        await ctx.answerCbQuery('❌ Capa não encontrada.', { show_alert: true });
      }
    } catch (error) {
      console.error('[ERROR] el_cset:', error.message);
      await ctx.answerCbQuery('❌ Erro ao definir capa.', { show_alert: true });
    }
  });

  bot.action(/^el_cdef_(\d+)$/, async (ctx) => {
    const coverId = parseInt(ctx.match[1]);
    const userIdStr = ctx.from.id.toString();
    try {
      const admin = await isAdmin(userIdStr);
      if (!admin) return ctx.answerCbQuery('❌ Acesso Negado.', { show_alert: true });

      await coverDb.setGlobalDefaultCover(coverId);
      await ctx.answerCbQuery('🌟 Capa definida como Padrão Global do bot!', { show_alert: true });
      
      const covers = await coverDb.getAllCovers(); 
      const newIndex = covers.findIndex(c => c.id_cover === coverId);
      await renderCoverFrame(ctx, newIndex >= 0 ? newIndex : 0, userIdStr, false, admin);

    } catch (error) {
      console.error('[ERROR] el_cdef:', error.message);
      await ctx.answerCbQuery('❌ Erro ao atualizar o padrão global.', { show_alert: true });
    }
  });
};