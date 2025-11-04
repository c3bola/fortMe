const { Telegraf } = require('telegraf');
const config = require('./config/config');
const userCommands = require('./commands/userCommands');
const adminCommands = require('./commands/adminCommands');
const initializeCronJobs = require('./cron/cronJobs');

const bot = new Telegraf(config.apiKey);

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
try {
  userCommands(bot);
  console.log('[DEBUG] Comandos de usuário registrados com sucesso.');
} catch (error) {
  console.error('[ERROR] Falha ao registrar comandos de usuário:', error.message);
}

// Carregar comandos de administradores
try {
  adminCommands(bot);
  console.log('[DEBUG] Comandos de administradores registrados com sucesso.');
} catch (error) {
  console.error('[ERROR] Falha ao registrar comandos de administradores:', error.message);
}

// Inicializar cron jobs
initializeCronJobs();

bot.launch();
console.log('Bot iniciado com sucesso!');

// Habilitar encerramento seguro
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
