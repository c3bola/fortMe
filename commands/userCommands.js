const config = require('../config/config');

module.exports = (bot) => {
  console.log('[DEBUG] Carregando comandos de usuário...');

  const disabledCommandResponses = [
    '🚫 Esse comando foi dar uma volta no Battle Bus. Tente outro! 🚌',
    '😴 O comando tá descansando no lobby. Volte mais tarde! 🕹️',
    '❌ Ops! Esse comando tá desativado. Luigi disse que é culpa do véio C3bola. 😂',
    '🤔 Parece que esse comando tá perdido na tempestade. Bora tentar outro? 🌩️',
    '🛠️ Estamos ajustando esse comando. Luigi tá testando e o C3bola tá programando! 🛠️',
    '🎮 Esse comando foi buscar V-Bucks. Enquanto isso, bora um GG? 🏆',
    '🔥 O comando tá pegando fogo no modo criativo. Volte mais tarde! 🔥',
    '😂 Esse comando tá rindo das skins do Luigi. Tente outro! 🎭',
    '🌟 O comando tá treinando pra ser Try Hard. Enquanto isso, bora uma partida? 🌟',
    '🕹️ O comando foi jogar com o C3bola. Ele disse que volta logo... ou não. 😂'
  ];

  const sendDisabledResponse = (ctx) => {
    const randomResponse = disabledCommandResponses[Math.floor(Math.random() * disabledCommandResponses.length)];
    ctx.reply(randomResponse);
  };

  // Registrar comandos de usuário com verificação de ativação
  try {
    if (config.commands.fortgirl) {
      console.log('[DEBUG] Registrando comando /fortgirl...');
      require('./user/fortgirl')(bot);
    } else {
      bot.command('fortgirl', sendDisabledResponse);
    }

    if (config.commands.tryhardme) {
      console.log('[DEBUG] Registrando comando /tryhardme...');
      require('./user/tryhardme')(bot);
    } else {
      bot.command('tryhardme', sendDisabledResponse);
    }

    if (config.commands.help) {
      console.log('[DEBUG] Registrando comando /help...');
      require('./user/help')(bot);
    } else {
      bot.command('help', sendDisabledResponse);
    }
    if (config.commands.fortme) {
      console.log('[DEBUG] Registrando comando /fortme...');
      require('./user/fortme')(bot);
    } else {
      bot.command('fortme', sendDisabledResponse);
    }
    if (config.commands.jonesyme) {
      console.log('[DEBUG] Registrando comando /jonesyme...');
      require('./user/jonesyme')(bot);
    } else {
      bot.command('jonesyme', sendDisabledResponse);
    }

    if (config.commands.x1) {
      console.log('[DEBUG] Registrando comando /x1...');
      require('./user/x1')(bot);
    } else {
      bot.command('x1', sendDisabledResponse);
    }

    if (config.commands.ranking) {
      console.log('[DEBUG] Registrando comando /ranking...');
      require('./user/ranking')(bot);
    } else {
      bot.command('ranking', sendDisabledResponse);
    }

    if (config.commands.x1stats) {
      console.log('[DEBUG] Registrando comando /x1stats...');
      require('./user/x1stats')(bot);
    } else {
      bot.command('x1stats', sendDisabledResponse);
    }

    console.log('[DEBUG] Comandos de usuário carregados com sucesso.');
  } catch (error) {
    console.error('[ERROR] Falha ao registrar comandos de usuário:', error.message);
  }
};
