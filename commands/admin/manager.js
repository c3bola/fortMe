const { query } = require('../../database/dbConnection');
const config = require('../../config/config');

// Mapa de features por código
const FEATURES_MAP = {
  'girls': { id: 2, code: 'fortgirl', name: 'FortGirl' },
  'me': { id: 1, code: 'fortme', name: 'FortMe' },
  'jonesy': { id: 3, code: 'jonesyme', name: 'Jonesy' },
  'tryhard': { id: 4, code: 'tryhardme', name: 'Tryhard' }
};

module.exports = (bot) => {
  bot.command('manager', async (ctx) => {
    try {
      console.log('[DEBUG] Comando /manager iniciado', { userId: ctx.from?.id });

      // Parsear argumentos: /manager girls
      const args = ctx.message.text.split(' ').slice(1);
      const typeArg = args[0]?.toLowerCase();

      if (!typeArg) {
        return ctx.reply(
          'Uso: /manager <tipo>\n\n' +
          'Tipos disponíveis:\n' +
          '- girls (FortGirl)\n' +
          '- me (FortMe)\n' +
          '- jonesy (Jonesy)\n' +
          '- tryhard (Tryhard)'
        );
      }

      // Validar tipo
      const feature = FEATURES_MAP[typeArg];
      if (!feature) {
        return ctx.reply(
          `Tipo inválido: "${typeArg}"\n\n` +
          `Tipos disponíveis:\n` +
          `- girls (FortGirl)\n` +
          `- me (FortMe)\n` +
          `- jonesy (Jonesy)\n` +
          `- tryhard (Tryhard)`
        );
      }

      // Buscar conteúdos do tipo especificado
      const contents = await query(
        `SELECT c.*, u.first_name, u.last_name, u.username
         FROM tb_fortme_contents c
         LEFT JOIN tb_user u ON c.created_by = u.id_user
         WHERE c.fk_id_features = ?
         ORDER BY c.id_fortme_contents ASC`,
        [feature.id]
      );

      if (contents.length === 0) {
        return ctx.reply(`Nenhum conteúdo registrado para ${feature.name}.`);
      }

      // Buscar metadados dos admins
      for (let content of contents) {
        const metadata = await query(
          `SELECT m.field_name, d.value 
           FROM tb_data_user d
           JOIN tb_metadata m ON d.fk_id_metadata = m.id_metadata
           WHERE d.fk_id_user = ?`,
          [content.created_by]
        );

        content.adminName = metadata.find(m => m.field_name === 'username')?.value || 
                           metadata.find(m => m.field_name === 'first_name')?.value || 
                           'Desconhecido';
      }

      // Exibir o primeiro item
      await sendContent(ctx, contents, 0, feature, true);

    } catch (error) {
      console.error('[ERROR] Erro no comando /manager:', error.message);
      console.error('[ERROR] Stack trace:', error.stack);
      return ctx.reply('❌ Erro ao acessar o banco de dados.');
    }
  });

  // Handler para navegação
  bot.action(/navigate_manager_(\w+)_(\d+)_(next|prev|delete|toggle)/, async (ctx) => {
    try {
      const [, type, index, action] = ctx.match;
      const currentIndex = parseInt(index, 10);

      const feature = FEATURES_MAP[type];
      if (!feature) {
        return ctx.answerCbQuery('Tipo de conteúdo inválido.', { show_alert: true });
      }

      // Buscar conteúdos novamente
      const contents = await query(
        `SELECT c.*, u.first_name, u.last_name, u.username
         FROM tb_fortme_contents c
         LEFT JOIN tb_user u ON c.created_by = u.id_user
         WHERE c.fk_id_features = ?
         ORDER BY c.id_fortme_contents ASC`,
        [feature.id]
      );

      if (contents.length === 0) {
        return ctx.editMessageCaption('Nenhum conteúdo restante.', {
          reply_markup: { inline_keyboard: [] }
        });
      }

      // Buscar metadados dos admins
      for (let content of contents) {
        const metadata = await query(
          `SELECT m.field_name, d.value 
           FROM tb_data_user d
           JOIN tb_metadata m ON d.fk_id_metadata = m.id_metadata
           WHERE d.fk_id_user = ?`,
          [content.created_by]
        );

        content.adminName = metadata.find(m => m.field_name === 'username')?.value || 
                           metadata.find(m => m.field_name === 'first_name')?.value || 
                           'Desconhecido';
      }

      let newIndex = currentIndex;

      if (action === 'delete') {
        // Remover o item
        const contentToDelete = contents[currentIndex];
        await query(
          'DELETE FROM tb_fortme_contents WHERE id_fortme_contents = ?',
          [contentToDelete.id_fortme_contents]
        );

        console.log('[INFO] Conteúdo removido', { id: contentToDelete.id_fortme_contents });
        await logAction(ctx, `🗑 ${feature.name}: "${contentToDelete.text}" foi removido.`, bot);

        // Recarregar lista
        const updatedContents = await query(
          `SELECT c.*, u.first_name, u.last_name, u.username
           FROM tb_fortme_contents c
           LEFT JOIN tb_user u ON c.created_by = u.id_user
           WHERE c.fk_id_features = ?
           ORDER BY c.id_fortme_contents ASC`,
          [feature.id]
        );

        if (updatedContents.length === 0) {
          return ctx.editMessageCaption('Nenhum conteúdo restante.', {
            reply_markup: { inline_keyboard: [] }
          });
        }

        // Buscar metadados novamente
        for (let content of updatedContents) {
          const metadata = await query(
            `SELECT m.field_name, d.value 
             FROM tb_data_user d
             JOIN tb_metadata m ON d.fk_id_metadata = m.id_metadata
             WHERE d.fk_id_user = ?`,
            [content.created_by]
          );

          content.adminName = metadata.find(m => m.field_name === 'username')?.value || 
                             metadata.find(m => m.field_name === 'first_name')?.value || 
                             'Desconhecido';
        }

        newIndex = currentIndex >= updatedContents.length ? updatedContents.length - 1 : currentIndex;
        return sendContent(ctx, updatedContents, newIndex, feature, false);

      } else if (action === 'next') {
        newIndex = (currentIndex + 1) % contents.length;
      } else if (action === 'prev') {
        newIndex = (currentIndex - 1 + contents.length) % contents.length;
      } else if (action === 'toggle') {
        // Alternar status
        const contentToToggle = contents[currentIndex];
        const newStatus = contentToToggle.status === 1 ? 0 : 1;

        await query(
          'UPDATE tb_fortme_contents SET status = ? WHERE id_fortme_contents = ?',
          [newStatus, contentToToggle.id_fortme_contents]
        );

        console.log('[INFO] Status alterado', { 
          id: contentToToggle.id_fortme_contents, 
          newStatus: newStatus === 1 ? 'Ativo' : 'Inativo' 
        });

        await logAction(
          ctx, 
          `☑️ ${feature.name}: "${contentToToggle.text}" foi ${newStatus === 1 ? 'ativado ✅' : 'desativado ❌'}.`,
          bot
        );

        // Atualizar o status no objeto
        contents[currentIndex].status = newStatus;
      }

      await sendContent(ctx, contents, newIndex, feature, false);

    } catch (error) {
      console.error('[ERROR] Erro no handler de navegação:', error.message);
      console.error('[ERROR] Stack trace:', error.stack);
      return ctx.answerCbQuery('Erro ao processar ação.', { show_alert: true });
    }
  });
};

// Função para enviar/editar conteúdo
async function sendContent(ctx, contents, index, feature, isNewMessage) {
  const item = contents[index];
  const total = contents.length;

  const caption = 
    `${item.text}\n\n` +
    (item.name ? `<b>Nome:</b> ${item.name}\n` : '') +
    `<b>Adicionado por:</b> ${item.adminName}\n` +
    `<b>Status:</b> ${item.status === 1 ? 'Ativo ✅' : 'Inativo ❌'}\n` +
    `<b>ID:</b> ${item.id_fortme_contents}\n` +
    `<b>Item:</b> ${index + 1}/${total}`;

  // Usar o tipo curto para o callback (girls, me, jonesy, tryhard)
  const typeKey = Object.keys(FEATURES_MAP).find(k => FEATURES_MAP[k].id === feature.id);

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '⬅️', callback_data: `navigate_manager_${typeKey}_${index}_prev` },
        { text: '🗑', callback_data: `navigate_manager_${typeKey}_${index}_delete` },
        { text: item.status === 1 ? '☑️' : '✅', callback_data: `navigate_manager_${typeKey}_${index}_toggle` },
        { text: '➡️', callback_data: `navigate_manager_${typeKey}_${index}_next` }
      ]
    ]
  };

  try {
    if (isNewMessage) {
      await ctx.replyWithPhoto(item.image_id, {
        caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      });
    } else {
      await ctx.editMessageMedia(
        {
          type: 'photo',
          media: item.image_id,
          caption,
          parse_mode: 'HTML'
        },
        { reply_markup: replyMarkup }
      );
    }
  } catch (error) {
    console.error('[ERROR] Falha ao exibir conteúdo:', error.message);
    if (isNewMessage) {
      ctx.reply('Erro ao exibir o conteúdo.');
    } else {
      ctx.answerCbQuery('Erro ao atualizar o conteúdo.', { show_alert: true });
    }
  }
}

// Função para registrar ação no log
async function logAction(ctx, message, bot) {
  const logGroup = config.logGroup;
  if (logGroup && logGroup.status && logGroup.id) {
    try {
      const options = {
        parse_mode: 'HTML'
      };

      if (logGroup.topic) {
        options.message_thread_id = logGroup.topic;
      }

      await bot.telegram.sendMessage(
        logGroup.id, 
        `📢 <b>Ação registrada:</b>\n${message}`, 
        options
      );
      console.log('[INFO] Ação registrada no grupo de logs.');
    } catch (error) {
      console.error('[ERROR] Falha ao registrar ação no grupo de logs:', error.message);
    }
  }
}
