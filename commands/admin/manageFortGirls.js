const fs = require('fs');
const path = require('path');
const config = require('../../config/config');
const fortGirlPath = path.join(__dirname, '../../database/fortgirl.json');

module.exports = (bot) => {
  bot.command('manageFortGirls', async (ctx) => {
    // Ler o arquivo fortgirl.json
    let fortGirls;
    try {
      fortGirls = JSON.parse(fs.readFileSync(fortGirlPath, 'utf8'));
    } catch (error) {
      console.error('[ERROR] Falha ao carregar o arquivo fortgirl.json:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de skins.');
    }

    if (fortGirls.length === 0) {
      return ctx.reply('Nenhuma skin registrada no momento.');
    }

    // Exibir o primeiro item
    const firstItem = fortGirls[0];
    await sendFortGirl(ctx, firstItem, 0, fortGirls.length, true);
  });

  bot.action(/navigate_fortgirl_(\d+)_(next|prev|delete|toggle)/, async (ctx) => {
    const [, index, action] = ctx.match;
    let fortGirls;
    try {
      fortGirls = JSON.parse(fs.readFileSync(fortGirlPath, 'utf8'));
    } catch (error) {
      console.error('[ERROR] Falha ao carregar o arquivo fortgirl.json:', error.message);
      return ctx.answerCbQuery('Erro ao acessar o arquivo de skins.', { show_alert: true });
    }

    let currentIndex = parseInt(index, 10);

    if (action === 'delete') {
      // Remover o item atual
      const removedItem = fortGirls.splice(currentIndex, 1);
      try {
        fs.writeFileSync(fortGirlPath, JSON.stringify(fortGirls, null, 2), 'utf8');
        console.log(`[INFO] Skin "${removedItem[0].text}" removida com sucesso.`);
        await logAction(ctx, `🗑 A skin "${removedItem[0].text}" foi removida.`);
        if (fortGirls.length === 0) {
          return ctx.editMessageCaption('Nenhuma skin restante.', {
            reply_markup: { inline_keyboard: [] }
          });
        }
      } catch (error) {
        console.error('[ERROR] Falha ao salvar o arquivo fortgirl.json:', error.message);
        return ctx.answerCbQuery('Erro ao salvar as alterações.', { show_alert: true });
      }
      currentIndex = currentIndex >= fortGirls.length ? fortGirls.length - 1 : currentIndex;
    } else if (action === 'next') {
      currentIndex = (currentIndex + 1) % fortGirls.length;
    } else if (action === 'prev') {
      currentIndex = (currentIndex - 1 + fortGirls.length) % fortGirls.length;
    } else if (action === 'toggle') {
      // Alternar o status da skin
      fortGirls[currentIndex].status = !fortGirls[currentIndex].status;
      try {
        fs.writeFileSync(fortGirlPath, JSON.stringify(fortGirls, null, 2), 'utf8');
        console.log(`[INFO] Status da skin "${fortGirls[currentIndex].text}" alterado para ${fortGirls[currentIndex].status ? 'Ativo' : 'Inativo'}.`);
        await logAction(ctx, `☑️ O status da skin "${fortGirls[currentIndex].text}" foi alterado para ${fortGirls[currentIndex].status ? 'Ativo ✅' : 'Inativo ❌'}.`);
        // ctx.answerCbQuery(`Status alterado para ${fortGirls[currentIndex].status ? 'Ativo ✅' : 'Inativo ❌'}.`, { show_alert: true });
      } catch (error) {
        console.error('[ERROR] Falha ao salvar o arquivo fortgirl.json:', error.message);
        return ctx.answerCbQuery('Erro ao salvar as alterações.', { show_alert: true });
      }
    }

    const currentItem = fortGirls[currentIndex];
    await sendFortGirl(ctx, currentItem, currentIndex, fortGirls.length, false);
  });

  const sendFortGirl = async (ctx, item, index, total, isNewMessage) => {
    const caption = `${item.text}\n\n` +
      (item.name ? `<b>Nome:</b> ${item.name}\n` : '') + // Exibir o nome, se existir
      `<b>Adicionada por:</b> ${item.adminName}\n` +
      `<b>Status:</b> ${item.status ? 'Ativo ✅' : 'Inativo ❌'}\n` +
      `<b>ID:</b> ${item.id}\n` +
      `<b>Item:</b> ${index + 1}/${total}`;
      
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '⬅️', callback_data: `navigate_fortgirl_${index}_prev` },
          { text: '🗑', callback_data: `navigate_fortgirl_${index}_delete` },
          { text: item.status ? '☑️' : '✅', callback_data: `navigate_fortgirl_${index}_toggle` },
          { text: '➡️', callback_data: `navigate_fortgirl_${index}_next` }
        ]
      ]
    };

    try {
      if (isNewMessage) {
        // Enviar uma nova mensagem
        await ctx.replyWithPhoto(item.imageId, {
          caption,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        });
      } else {
        // Editar a mensagem existente
        await ctx.editMessageMedia(
          {
            type: 'photo',
            media: item.imageId,
            caption,
            parse_mode: 'HTML'
          },
          { reply_markup: replyMarkup }
        );
      }
    } catch (error) {
      console.error('[ERROR] Falha ao exibir a skin:', error.message);
      if (isNewMessage) {
        ctx.reply('Erro ao exibir a skin.');
      } else {
        ctx.answerCbQuery('Erro ao atualizar a skin.', { show_alert: true });
      }
    }
  };

  const logAction = async (ctx, message) => {
    const logGroup = config.logGroup;
    if (logGroup && logGroup.status && logGroup.id) {
      try {
        const options = {
          parse_mode: 'HTML'
        };

        // Adicionar o tópico, se configurado
        if (logGroup.topic) {
          options.message_thread_id = logGroup.topic;
        }

        await bot.telegram.sendMessage(logGroup.id, `📢 <b>Ação registrada:</b>\n${message}`, options);
        console.log('[INFO] Ação registrada no grupo de logs.');
      } catch (error) {
        console.error('[ERROR] Falha ao registrar ação no grupo de logs:', error.message);
      }
    }
  };
};
