const config = require('../../config/config');
const analyzeDalyGirl = require('../../cron/functions/analyzeDalyGirl');
const tryhardRanking = require('../../cron/functions/tryhardRanking');
const analyzeJonesy = require('../../cron/functions/analyzeJonesy');
const analyzeFortMe = require('../../cron/functions/analyzeFortMe');
const x1Ranking = require('../../cron/functions/x1Ranking');

module.exports = (bot) => {
  bot.command('sendrank', async (ctx) => {
    console.log('[INFO] Comando /sendrank recebido');
    console.log(`[DEBUG] User: ${ctx.from.id} (${ctx.from.first_name || ctx.from.username})`);
    console.log(`[DEBUG] Chat type: ${ctx.chat.type}`);
    
    // Verificar se é admin
    const isAdmin = config.admins.some(admin => admin.id === ctx.from.id);
    console.log(`[DEBUG] É admin: ${isAdmin}`);
    
    if (!isAdmin) {
      console.log('[WARNING] Usuário não autorizado tentou usar /sendrank');
      return ctx.reply('❌ Você não tem permissão para usar este comando.');
    }

    // Verificar se está em chat privado
    if (ctx.chat.type !== 'private') {
      console.log('[WARNING] Tentativa de usar /sendrank fora do privado');
      return ctx.reply('⚠️ Este comando só pode ser usado no privado do bot.');
    }

    const args = ctx.message.text.split(' ');
    const rankType = args[1]?.toLowerCase();
    console.log(`[DEBUG] Tipo de rank solicitado: ${rankType || 'nenhum (help)'}`);

    // Se não passou nenhum argumento, mostrar o help
    if (!rankType) {
      const helpMessage = `
📊 <b>Comando /sendrank</b>

<b>Uso:</b> <code>/sendrank &lt;tipo&gt;</code>

<b>Tipos de rank disponíveis:</b>

🌸 <code>fortgirl</code> - Envia o ranking das FortGirls
  • Mostra a skin mais amada e mais odiada do dia

🔥 <code>tryhard</code> - Envia o ranking de Tryhard/Banana
  • Mostra o maior tryhard e maior banana do dia

👤 <code>jonesy</code> - Envia análise do Jonesy
  • Envia resultado do Jonesy do dia

🎮 <code>fortme</code> - Envia análise do FortMe
  • Envia resultado do FortMe do dia

⚔️ <code>x1</code> - Envia ranking de X1
  • Mostra o ranking de vitórias em X1 do dia

<b>Exemplo:</b>
<code>/sendrank fortgirl</code>
<code>/sendrank tryhard</code>
<code>/sendrank x1</code>

💡 <i>Este comando substitui o sistema de cron automático.</i>
      `.trim();
      
      return ctx.reply(helpMessage, { parse_mode: 'HTML' });
    }

    // Executar a função correspondente ao tipo de rank
    try {
      let statusMessage = null;

      switch (rankType) {
        case 'fortgirl':
        case 'fortgirls':
          statusMessage = await ctx.reply('🌸 Enviando ranking das FortGirls...');
          await analyzeDalyGirl(bot);
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Ranking das FortGirls enviado com sucesso!'
          );
          break;

        case 'tryhard':
          statusMessage = await ctx.reply('🔥 Enviando ranking de Tryhard/Banana...');
          await tryhardRanking(bot);
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Ranking de Tryhard/Banana enviado com sucesso!'
          );
          break;

        case 'jonesy':
          statusMessage = await ctx.reply('👤 Enviando análise do Jonesy...');
          await analyzeJonesy(bot);
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Análise do Jonesy enviada com sucesso!'
          );
          break;

        case 'fortme':
          statusMessage = await ctx.reply('🎮 Enviando análise do FortMe...');
          await analyzeFortMe(bot);
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Análise do FortMe enviada com sucesso!'
          );
          break;

        case 'x1':
          console.log('[INFO] Iniciando envio de ranking X1...');
          statusMessage = await ctx.reply('⚔️ Enviando ranking de X1...');
          console.log('[DEBUG] Chamando função x1Ranking...');
          await x1Ranking(bot);
          console.log('[SUCCESS] Função x1Ranking concluída');
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Ranking de X1 enviado com sucesso!'
          );
          break;

        default:
          console.log(`[WARNING] Tipo de rank inválido: ${rankType}`);
          return ctx.reply(`❌ Tipo de rank inválido: <code>${rankType}</code>\n\nUse <code>/sendrank</code> sem argumentos para ver os tipos disponíveis.`, { parse_mode: 'HTML' });
      }

      // Log da execução para o grupo de logs
      if (config.logGroup?.status && config.logGroup?.id) {
        const logMessage = `📊 <b>Comando /sendrank executado</b>\n\n👤 <b>Admin:</b> ${ctx.from.first_name || ctx.from.username}\n📝 <b>Tipo:</b> ${rankType}\n⏰ <b>Horário:</b> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
        
        bot.telegram.sendMessage(config.logGroup.id, logMessage, {
          parse_mode: 'HTML',
          message_thread_id: config.logGroup.topic || undefined
        }).catch((error) => {
          console.error('[ERROR] Falha ao enviar log:', error.message);
        });
      }

    } catch (error) {
      console.error('[ERROR] Erro ao executar sendrank:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      
      await ctx.reply(`❌ Erro ao enviar o ranking: ${error.message}`, { parse_mode: 'HTML' });
      
      // Log de erro para o grupo de logs
      if (config.logGroup?.status && config.logGroup?.id) {
        const errorLogMessage = `❌ <b>Erro no comando /sendrank</b>\n\n👤 <b>Admin:</b> ${ctx.from.first_name || ctx.from.username}\n📝 <b>Tipo:</b> ${rankType}\n⚠️ <b>Erro:</b> ${error.message}`;
        
        bot.telegram.sendMessage(config.logGroup.id, errorLogMessage, {
          parse_mode: 'HTML',
          message_thread_id: config.logGroup.topic || undefined
        }).catch((err) => {
          console.error('[ERROR] Falha ao enviar log de erro:', err.message);
        });
      }
    }
  });
};
