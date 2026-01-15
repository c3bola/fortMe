const { Telegraf } = require('telegraf');
const config = require('./config/config');
const userCommands = require('./commands/userCommands');
const adminCommands = require('./commands/adminCommands');
const { ensureGroupInBroadcast } = require('./utils/broadcastUtils');

const bot = new Telegraf(config.apiKey);

// Middleware de monitoramento - logar todas as atualizações
bot.use((ctx, next) => {
  const updateType = ctx.updateType;
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  const username = ctx.from?.username || ctx.from?.first_name;
  
  if (updateType === 'message' && ctx.message?.text) {
    console.log(`[UPDATE] Mensagem recebida | Chat: ${chatId} | User: ${userId} (${username}) | Texto: "${ctx.message.text}"`);
  } else if (updateType === 'callback_query') {
    console.log(`[UPDATE] Callback recebido | Chat: ${chatId} | User: ${userId} (${username}) | Data: "${ctx.callbackQuery?.data}"`);
  } else {
    console.log(`[UPDATE] ${updateType} recebido | Chat: ${chatId} | User: ${userId} (${username})`);
  }
  
  return next();
});

// Middleware para normalizar comandos (remover @<botname>)
bot.use((ctx, next) => {
  if (ctx.message?.text) {
    const command = ctx.message.text.split(' ')[0];
    if (command.includes('@')) {
      const normalizedCommand = command.split('@')[0];
      ctx.message.text = ctx.message.text.replace(command, normalizedCommand);
      console.log(`[DEBUG] Comando normalizado: ${ctx.message.text}`);
    }
  }
  if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
    ensureGroupInBroadcast(ctx);
  }
  return next();
});

// Middleware para garantir que todas as callbackQuery sejam respondidas
bot.use((ctx, next) => {
  if (ctx.callbackQuery) {
    try {
      ctx.answerCbQuery().catch((error) => {
        console.error('[ERROR] Falha ao responder callbackQuery:', error.message);
      });
    } catch (error) {
      console.error('[ERROR] Erro ao processar callbackQuery:', error.message);
    }
  }
  return next();
});


// Carregar comandos de usuários
console.log('[INFO] ========================================');
console.log('[INFO] Iniciando carregamento de comandos...');
console.log('[INFO] ========================================');

try {
  console.log('[INFO] Carregando comandos de usuário...');
  userCommands(bot);
  console.log('[SUCCESS] ✓ Comandos de usuário registrados com sucesso.');
} catch (error) {
  console.error('[ERROR] ✗ Falha ao registrar comandos de usuário:', error.message);
  console.error('[ERROR] Stack trace:', error.stack);
}

// Carregar comandos de administradores
try {
  console.log('[INFO] Carregando comandos de administradores...');
  adminCommands(bot);
  console.log('[SUCCESS] ✓ Comandos de administradores registrados com sucesso.');
} catch (error) {
  console.error('[ERROR] ✗ Falha ao registrar comandos de administradores:', error.message);
  console.error('[ERROR] Stack trace:', error.stack);
}

// Handler global de erros do bot
bot.catch((err, ctx) => {
  console.error('[ERROR] Erro não tratado capturado pelo bot:');
  console.error('[ERROR] Tipo de update:', ctx.updateType);
  console.error('[ERROR] Chat ID:', ctx.chat?.id);
  console.error('[ERROR] User ID:', ctx.from?.id);
  console.error('[ERROR] Mensagem de erro:', err.message);
  console.error('[ERROR] Stack trace:', err.stack);
  
  // Tentar enviar mensagem de erro ao usuário
  if (ctx.chat) {
    try {
      ctx.reply('❌ Ocorreu um erro inesperado. O problema foi registrado e será corrigido em breve.').catch((replyErr) => {
        console.error('[ERROR] Não foi possível enviar mensagem de erro ao usuário:', replyErr.message);
      });
    } catch (replyError) {
      console.error('[ERROR] Falha ao responder erro:', replyError.message);
    }
  }
});

// Handler de erros não tratados do processo
process.on('uncaughtException', (error) => {
  console.error('[CRITICAL] Exceção não capturada:', error.message);
  console.error('[CRITICAL] Stack trace:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Promessa rejeitada não tratada:', reason);
  console.error('[CRITICAL] Promise:', promise);
});

console.log('[INFO] ========================================');
console.log('[INFO] Iniciando bot...');
console.log('[INFO] ========================================');

bot.launch()
  .then(() => {
    console.log('[SUCCESS] ========================================');
    console.log('[SUCCESS] ✓ Bot iniciado com sucesso!');
    console.log('[SUCCESS] ✓ Bot pronto para receber comandos.');
    console.log('[SUCCESS] ========================================');
  })
  .catch((error) => {
    console.error('[CRITICAL] ========================================');
    console.error('[CRITICAL] ✗ Falha ao iniciar o bot:', error.message);
    console.error('[CRITICAL] Stack trace:', error.stack);
    console.error('[CRITICAL] ========================================');
    process.exit(1);
  });

// Habilitar encerramento seguro
process.once('SIGINT', () => {
  console.log('[INFO] Recebido sinal SIGINT. Encerrando bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('[INFO] Recebido sinal SIGTERM. Encerrando bot...');
  bot.stop('SIGTERM');
});
