'use strict';

const config = require('../config/config');

// Importa os manifestos de cada módulo
const modules = [
  require('../modules/system'),
  require('../modules/skin'),
  require('../modules/x1'),
  require('../modules/ranking'),
  require('../modules/elementais')
];

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

  // Itera sobre todos os manifestos de módulos
  for (const mod of modules) {
    if (!mod.user) continue;

    // Itera sobre os comandos de usuário listados no manifesto do módulo
    for (const cmd of mod.user) {
      try {
        if (config.commands[cmd.name]) {
          // Comando ativo: delega o registro ao próprio arquivo do comando
          cmd.register(bot);
          console.log(`[INFO] Comando de usuário ativado: /${cmd.name}`);
        } else {
          // Comando inativo: intercepta a chamada principal e seus aliases
          bot.command(cmd.name, sendDisabledResponse);
          if (cmd.aliases) {
            cmd.aliases.forEach(alias => bot.command(alias, sendDisabledResponse));
          }
          console.log(`[WARN] Comando de usuário desativado: /${cmd.name}`);
        }
      } catch (error) {
        console.error(`[ERROR] Falha ao processar o comando de usuário /${cmd.name}:`, error.message);
      }
    }
  }

  console.log('[DEBUG] Comandos de usuário carregados com sucesso.');
};