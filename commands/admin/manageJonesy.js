const fs = require('fs');
const path = require('path');
const config = require('../../config/config');
const fortJonesyPath = path.join(__dirname, '../../database/fortjonesy.json');

module.exports = (bot) => {
  bot.command('manageJonesy', async (ctx) => {
    // Ler o arquivo fortjonesy.json
    let fortJonesy;
    try {
      fortJonesy = JSON.parse(fs.readFileSync(fortJonesyPath, 'utf8'));
    } catch (error) {
      console.error('[ERROR] Falha ao carregar o arquivo fortjonesy.json:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de skins.');
    }

    if (fortJonesy.length === 0) {
      return ctx.reply('Nenhuma skin registrada no momento.');
    }

    // Exibir o primeiro item
    const firstItem = fortJonesy[0];
    await sendFortJonesy(ctx, firstItem, 0, fortJonesy.length, true);
  });

  bot.action(/navigate_fortjonesy_(\d+)_(next|prev|delete|toggle)/, async (ctx) => {
    const [, index, action] = ctx.match;
    let fortJonesy;
    try {
      fortJonesy = JSON.parse(fs.readFileSync(fortJonesyPath, 'utf8'));
    } catch (error) {
      console.error('[ERROR] Falha ao carregar o arquivo fortjonesy.json:', error.message);
      return ctx.answerCbQuery('Erro ao acessar o arquivo de skins.', { show_alert: true });
    }

    let currentIndex = parseInt(index, 10);

    if (action === 'delete') {
      // Remover o item atual
      const removedItem = fortJonesy.splice(currentIndex, 1);
      try {
        fs.writeFileSync(fortJonesyPath, JSON.stringify(fortJonesy, null, 2), 'utf8');
        console.log(`[INFO] Skin "${removedItem[0].text}" removida com sucesso.`);
        await logAction(ctx, `🗑 A skin "${removedItem[0].text}" foi removida.`);
        if (fortJonesy.length === 0) {
          return ctx.editMessageCaption('Nenhuma skin restante.', {
            reply_markup: { inline_keyboard: [] }
          });
        }
      } catch (error) {
        console.error('[ERROR] Falha ao salvar o arquivo fortjonesy.json:', error.message);
        return ctx.answerCbQuery('Erro ao salvar as alterações.', { show_alert: true });
      }
      currentIndex = currentIndex >= fortJonesy.length ? fortJonesy.length - 1 : currentIndex;
    } else if (action === 'next') {
      currentIndex = (currentIndex + 1) % fortJonesy.length;
    } else if (action === 'prev') {
      currentIndex = (currentIndex - 1 + fortJonesy.length) % fortJonesy.length;
    } else if (action === 'toggle') {
      // Alternar o status da skin
      fortJonesy[currentIndex].status = !fortJonesy[currentIndex].status;
      try {
        fs.writeFileSync(fortJonesyPath, JSON.stringify(fortJonesy, null, 2), 'utf8');
        console.log(`[INFO] Status da skin "${fortJonesy[currentIndex].text}" alterado para ${fortJonesy[currentIndex].status ? 'Ativo' : 'Inativo'}.`);
        await logAction(ctx, `☑️ O status da skin "${fortJonesy[currentIndex].text}" foi alterado para ${fortJonesy[currentIndex].status ? 'Ativo ✅' : 'Inativo ❌'}.`);
      } catch (error) {
        console.error('[ERROR] Falha ao salvar o arquivo fortjonesy.json:', error.message);
        return ctx.answerCbQuery('Erro ao salvar as alterações.', { show_alert: true });
      }
    }

    const currentItem = fortJonesy[currentIndex];
    await sendFortJonesy(ctx, currentItem, currentIndex, fortJonesy.length, false);
  });

  const sendFortJonesy = async (ctx, item, index, total, isNewMessage) => {
    const caption = `${item.text}\n\n` +
      (item.name ? `<b>Nome:</b> ${item.name}\n` : '') +
      `<b>Adicionada por:</b> ${item.adminName}\n` +
      `<b>Status:</b> ${item.status ? 'Ativo ✅' : 'Inativo ❌'}\n` +
      `<b>ID:</b> ${item.id}\n` +
      `<b>Item:</b> ${index + 1}/${total}`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '⬅️', callback_data: `navigate_fortjonesy_${index}_prev` },
          { text: '🗑', callback_data: `navigate_fortjonesy_${index}_delete` },
          { text: item.status ? '☑️' : '✅', callback_data: `navigate_fortjonesy_${index}_toggle` },
          { text: '➡️', callback_data: `navigate_fortjonesy_${index}_next` }
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
