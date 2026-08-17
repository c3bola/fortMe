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

  // ─── COMANDOS GERAIS ────────────────────────────────────────────────────────
  try {
    if (config.commands.fortgirl) {
      console.log('[DEBUG] Registrando comando /fortgirl...');
      require('./user/fortgirl')(bot);
    } else { bot.command('fortgirl', sendDisabledResponse); }

    if (config.commands.tryhardme) {
      console.log('[DEBUG] Registrando comando /tryhardme...');
      require('./user/tryhardme')(bot);
    } else { bot.command('tryhardme', sendDisabledResponse); }

    if (config.commands.help) {
      console.log('[DEBUG] Registrando comando /help...');
      require('./user/help')(bot);
    } else { bot.command('help', sendDisabledResponse); }

    if (config.commands.fortme) {
      console.log('[DEBUG] Registrando comando /fortme...');
      require('./user/fortme')(bot);
    } else { bot.command('fortme', sendDisabledResponse); }

    if (config.commands.jonesyme) {
      console.log('[DEBUG] Registrando comando /jonesyme...');
      require('./user/jonesyme')(bot);
    } else { bot.command('jonesyme', sendDisabledResponse); }

    if (config.commands.x1) {
      console.log('[DEBUG] Registrando comando /x1...');
      require('./user/x1')(bot);
    } else { bot.command('x1', sendDisabledResponse); }

    // ─── MÓDULO ELEMENTAIS (AGORA ISOLADOS) ──────────────────────────────────
    
    if (config.commands.elementais) {
      console.log('[DEBUG] Registrando comando /elementais...');
      require('./user/elementais')(bot);
    } else { 
      bot.command('elementais', sendDisabledResponse); 
      bot.command('sprites', sendDisabledResponse); // Assumindo que /sprites seja um alias tratado aqui
    }

    if (config.commands.sprite) {
      console.log('[DEBUG] Registrando comando /sprite...');
      require('./user/sprite')(bot);
    } else { bot.command('sprite', sendDisabledResponse); }

    if (config.commands.colecao) {
      console.log('[DEBUG] Registrando comando /colecao...');
      require('./user/colecao')(bot);
    } else { bot.command('colecao', sendDisabledResponse); }

    if (config.commands.faltam) {
      console.log('[DEBUG] Registrando comando /faltam...');
      require('./user/faltam')(bot);
    } else { bot.command('faltam', sendDisabledResponse); }

    if (config.commands.estatisticas) {
      console.log('[DEBUG] Registrando comando /estatisticas...');
      require('./user/estatisticas')(bot);
    } else { bot.command('estatisticas', sendDisabledResponse); }

    if (config.commands.perfil) {
      console.log('[DEBUG] Registrando comando /perfil...');
      require('./user/perfil')(bot);
    } else { bot.command('perfil', sendDisabledResponse); }

    if (config.commands.configsprites) {
      console.log('[DEBUG] Registrando comando /configsprites...');
      require('./user/configsprites')(bot);
    } else { bot.command('configsprites', sendDisabledResponse); }

    if (config.commands.guardioes) {
      console.log('[DEBUG] Registrando comando /guardioes...');
      require('./user/guardioes')(bot);
    } else { bot.command('guardioes', sendDisabledResponse); }

    if (config.commands.diario) {
      console.log('[DEBUG] Registrando comando /diario...');
      require('./user/diario')(bot);
    } else { bot.command('diario', sendDisabledResponse); }

    if (config.commands.agradecer) {
      console.log('[DEBUG] Registrando comando /agradecer...');
      require('./user/agradecer')(bot);
    } else { bot.command('agradecer', sendDisabledResponse); }

    if (config.commands.ajuda) {
      console.log('[DEBUG] Registrando comando /ajuda...');
      require('./user/ajuda')(bot);
    } else { bot.command('ajuda', sendDisabledResponse); }

    if (config.commands.comparar) {
      console.log('[DEBUG] Registrando comando /comparar...');
      require('./user/comparar')(bot);
    } else { bot.command('comparar', sendDisabledResponse); }

    console.log('[DEBUG] Comandos de usuário carregados com sucesso.');
  } catch (error) {
    console.error('[ERROR] Falha ao registrar comandos de usuário:', error.message);
  }
};