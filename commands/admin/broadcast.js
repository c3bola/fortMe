const {
  isAdmin,
  getBroadcastGroups,
  saveBroadcastHistory,
  getBroadcastHistory
} = require('../../utils/databaseUtilsMySQL');

module.exports = (bot) => {
  bot.command('broadcast', async (ctx) => {
    try {
      const userId = ctx.from.id;
      const username = ctx.from.username || ctx.from.first_name;
      
      // Verificar se é admin
      const adminStatus = await isAdmin(userId);
      if (!adminStatus) {
        return ctx.reply('❌ Este comando é apenas para administradores!');
      }
      
      // Pegar mensagem a ser transmitida
      const messageText = ctx.message.text.split(' ').slice(1).join(' ');
      
      if (!messageText || messageText.trim() === '') {
        return ctx.reply(
          '📢 <b>Como usar o broadcast:</b>\n\n' +
          '<code>/broadcast [mensagem]</code>\n\n' +
          '<b>Exemplo:</b>\n' +
          '<code>/broadcast Olá pessoal! Novo update disponível! 🎉</code>\n\n' +
          '💡 A mensagem será enviada para todos os grupos onde o bot está ativo.',
          { parse_mode: 'HTML' }
        );
      }
      
      // Buscar todos os grupos ativos
      const groups = await getBroadcastGroups();
      
      if (groups.length === 0) {
        return ctx.reply('❌ Nenhum grupo ativo encontrado para broadcast!');
      }
      
      // Confirmação
      await ctx.reply(
        `📢 <b>BROADCAST</b>\n\n` +
        `📨 Mensagem: <i>${messageText}</i>\n\n` +
        `📊 Será enviada para <b>${groups.length}</b> grupos.\n\n` +
        `⏳ Processando...`,
        { parse_mode: 'HTML' }
      );
      
      let successCount = 0;
      let failureCount = 0;
      const failedGroups = [];
      
      // Enviar para cada grupo
      for (const group of groups) {
        try {
          await bot.telegram.sendMessage(
            group.group_id,
            `📢 <b>MENSAGEM DO ADMINISTRADOR</b>\n\n${messageText}`,
            { parse_mode: 'HTML' }
          );
          successCount++;
          
          // Delay de 100ms entre mensagens para evitar rate limit
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`[BROADCAST] Erro ao enviar para grupo ${group.group_id}:`, error.message);
          failureCount++;
          failedGroups.push({
            group_id: group.group_id,
            group_name: group.group_name,
            error: error.message
          });
        }
      }
      
      // Salvar histórico do broadcast
      const messageFormat = {
        type: 'text',
        content: messageText,
        parse_mode: 'HTML'
      };
      
      await saveBroadcastHistory(
        userId,
        messageFormat,
        groups.length,
        successCount,
        failureCount
      );
      
      // Relatório final
      let reportMessage = `✅ <b>BROADCAST CONCLUÍDO</b>\n\n`;
      reportMessage += `📊 <b>Resumo:</b>\n`;
      reportMessage += `✅ Enviados: ${successCount}\n`;
      reportMessage += `❌ Falhas: ${failureCount}\n`;
      reportMessage += `📈 Total de grupos: ${groups.length}\n\n`;
      
      if (failedGroups.length > 0) {
        reportMessage += `⚠️ <b>Grupos com falha:</b>\n`;
        failedGroups.slice(0, 5).forEach(g => {
          reportMessage += `• ${g.group_name} (${g.group_id})\n`;
        });
        if (failedGroups.length > 5) {
          reportMessage += `<i>... e mais ${failedGroups.length - 5} grupos</i>\n`;
        }
      }
      
      reportMessage += `\n👤 Enviado por: ${username}`;
      
      await ctx.reply(reportMessage, { parse_mode: 'HTML' });
      
    } catch (error) {
      console.error('[BROADCAST ERROR]', error);
      ctx.reply('❌ Erro ao processar broadcast!');
    }
  });
  
  // Comando para ver histórico de broadcasts
  bot.command('broadcast_history', async (ctx) => {
    try {
      const userId = ctx.from.id;
      
      // Verificar se é admin
      const adminStatus = await isAdmin(userId);
      if (!adminStatus) {
        return ctx.reply('❌ Este comando é apenas para administradores!');
      }
      
      const history = await getBroadcastHistory(10);
      
      if (history.length === 0) {
        return ctx.reply('📭 Nenhum broadcast foi enviado ainda!');
      }
      
      let message = '📜 <b>HISTÓRICO DE BROADCASTS</b>\n\n';
      
      history.forEach((broadcast, index) => {
        const date = new Date(broadcast.created_at).toLocaleString('pt-BR');
        const successRate = ((broadcast.total_success / broadcast.total_groups_sent) * 100).toFixed(1);
        
        message += `<b>${index + 1}.</b> ${date}\n`;
        message += `   ✅ ${broadcast.total_success}/${broadcast.total_groups_sent} (${successRate}%)\n`;
        if (broadcast.total_failures > 0) {
          message += `   ❌ ${broadcast.total_failures} falhas\n`;
        }
        message += `\n`;
      });
      
      message += `💡 <i>Últimos 10 broadcasts</i>`;
      
      ctx.reply(message, { parse_mode: 'HTML' });
      
    } catch (error) {
      console.error('[BROADCAST HISTORY ERROR]', error);
      ctx.reply('❌ Erro ao buscar histórico!');
    }
  });
};
