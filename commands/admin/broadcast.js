const {
  isAdmin,
  getBroadcastGroups,
  saveBroadcastHistory
} = require('../../utils/databaseUtilsMySQL');

module.exports = (bot) => {
  bot.command('broadcast', async (ctx) => {
    try {
      const userId = ctx.from.id;
      const username = ctx.from.username || ctx.from.first_name;
      
      const adminStatus = await isAdmin(userId);
      if (!adminStatus) {
        return ctx.reply('❌ Este comando é apenas para administradores!');
      }
      
      const repliedMsg = ctx.message.reply_to_message;
      const messageText = ctx.message.text.split(' ').slice(1).join(' ');

      if (!repliedMsg && (!messageText || messageText.trim() === '')) {
        return ctx.reply('📢 Use /broadcast [texto] ou responda uma mensagem para clonar.', { parse_mode: 'HTML' });
      }
      
      // Buscar todos os grupos ativos
      const groups = await getBroadcastGroups();
      
      if (groups.length === 0) {
        return ctx.reply('❌ Nenhum grupo ativo encontrado para broadcast!');
      }
      
      await ctx.reply(`⏳ Processando broadcast para <b>${groups.length}</b> grupos...`, { parse_mode: 'HTML' });
      
      let successCount = 0;
      let failureCount = 0;
      
      // FOR COMPLETO E CORRIGIDO
      for (const group of groups) {
        try {
          if (repliedMsg) {
            // Preparamos as opções base (legenda e modo HTML)
            const options = { 
              parse_mode: 'HTML',
              caption: repliedMsg.caption || ''
            };

            // Adicionamos as entidades de formatação originais se existirem
            if (repliedMsg.caption_entities) {
              options.caption_entities = repliedMsg.caption_entities;
            }
            if (repliedMsg.entities) {
              options.entities = repliedMsg.entities;
            }

            // Clona a mídia conforme o tipo
            if (repliedMsg.photo) {
              await bot.telegram.sendPhoto(group.group_id, repliedMsg.photo[repliedMsg.photo.length - 1].file_id, options);
            } else if (repliedMsg.video) {
              await bot.telegram.sendVideo(group.group_id, repliedMsg.video.file_id, options);
            } else if (repliedMsg.document) {
              await bot.telegram.sendDocument(group.group_id, repliedMsg.document.file_id, options);
            } else if (repliedMsg.text) {
              await bot.telegram.sendMessage(group.group_id, repliedMsg.text, options);
            }
          } else {
            // Envio de texto puro (quando não houve resposta de mensagem)
            await bot.telegram.sendMessage(
              group.group_id,
              `📢 <b>MENSAGEM DO ADMINISTRADOR</b>\n\n${messageText}`,
              { parse_mode: 'HTML' }
            );
          }
          
          successCount++;
          // Delay de segurança entre envios
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`[BROADCAST] Erro ao enviar para grupo ${group.group_id}:`, error.message);
          failureCount++;
        }
      }
      
      await ctx.reply(`✅ Broadcast concluído! Sucesso: ${successCount} | Falhas: ${failureCount}`);
      
    } catch (error) {
      console.error('[BROADCAST ERROR]', error);
      ctx.reply('❌ Erro ao processar broadcast!');
    }
  });
  
  // ... (broadcast_history permanece igual)
};