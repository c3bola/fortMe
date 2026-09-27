'use strict';

const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Configurações do Grupo de Log
const LOG_GROUP_ID = '-1002578635990';
const LOG_TOPIC_ID = 8;

async function sendErrorLog(ctx, errorMessage, errorObj = null) {
  try {
    const user = ctx.from ? `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>` : 'Desconhecido';
    const commandOrAction = ctx.message?.text || ctx.callbackQuery?.data || 'Ação Desconhecida';
    
    // Captura o rastro completo do erro para sabermos exatamente a linha que quebrou
    const stackTrace = errorObj instanceof Error ? errorObj.stack : String(errorObj || 'Sem detalhes');

    const logText = 
      `🚨 <b>ERRO NO BOT</b> 🚨\n\n` +
      `👤 <b>Usuário:</b> ${user} (ID: <code>${ctx.from?.id}</code>)\n` +
      `💬 <b>Comando/Ação:</b> <code>${commandOrAction}</code>\n` +
      `⚠️ <b>Mensagem:</b> ${errorMessage}\n\n` +
      `🛠 <b>Detalhes técnicos:</b>\n<pre><code class="language-javascript">${stackTrace.substring(0, 3000)}</code></pre>`;

    await ctx.telegram.sendMessage(LOG_GROUP_ID, logText, {
      message_thread_id: LOG_TOPIC_ID,
      parse_mode: 'HTML'
    });
  } catch (logErr) {
    console.error('[FATAL] Falha ao enviar log de erro para o Telegram:', logErr);
  }
}

module.exports = { log, sendErrorLog };