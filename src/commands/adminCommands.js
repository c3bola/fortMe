'use strict';

// Importa os manifestos de cada módulo
const modules = [
  require('../modules/system'),
  require('../modules/skin'),
  require('../modules/x1'),
  require('../modules/ranking'),
  require('../modules/elementais')
];

module.exports = (bot) => {
  console.log('[DEBUG] Carregando comandos administrativos...');

  // Itera sobre todos os manifestos de módulos
  for (const mod of modules) {
    if (!mod.admin) continue;

    // Itera sobre os comandos administrativos listados no manifesto
    for (const cmd of mod.admin) {
      try {
        cmd.register(bot);
        console.log(`[INFO] Comando administrativo carregado: /${cmd.name}`);
      } catch (error) {
        console.error(`[ERROR] Falha ao carregar o comando administrativo /${cmd.name}:`, error.message);
      }
    }
  }

  console.log('[DEBUG] Comandos administrativos carregados com sucesso.');
};