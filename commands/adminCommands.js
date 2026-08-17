const config = require('../config/config');

module.exports = (bot) => {
  // const logToGroup = async (message) => {
  //   if (config.logGroup?.id && config.logGroup?.topic) {
  //     try {
  //       await bot.telegram.sendMessage(config.logGroup.id, message, {
  //         parse_mode: 'Markdown',
  //         message_thread_id: config.logGroup.topic // Garantir envio ao tópico específico
  //       });
  //     } catch (error) {
  //       console.error('[ERROR] Falha ao registrar log no grupo de logs:', error.message);
  //     }
  //   }
  // };

  // bot.command('admin', (ctx) => {
  //   const adminName = ctx.from.username || ctx.from.first_name;
  //   const adminId = ctx.from.id;

  //   if (config.admins.some(admin => admin.id === ctx.from.id)) {
  //     ctx.reply('Comandos de administrador disponíveis: /admin');
  //     // Registrar log após o comando ser executado
  //     logToGroup(`📋 *Comando Executado:*\n👤 *Administrador:* ${adminName} (ID: ${adminId})\n📝 *Comando:* /admin`);
  //   } else {
  //     ctx.reply('Você não tem permissão para usar comandos de administrador.');
  //   }
  // });

  // Função para carregar comandos com tratamento de erros
  const loadCommand = (commandPath) => {
    try {
      require(commandPath)(bot);
      console.log(`[INFO] Comando carregado: ${commandPath}`);
    } catch (error) {
      console.error(`[ERROR] Falha ao carregar o comando ${commandPath}:`, error.message);
    }
  };

  // Carregar comandos administrativos
  loadCommand('./admin/botConfig');
  loadCommand('./admin/addAdmin');
  loadCommand('./admin/registerFortGirl');
  loadCommand('./admin/configElemental');
  loadCommand('./admin/registerFortJonesy');
  loadCommand('./admin/registerFortMe');
  loadCommand('./admin/registerTryhardImage');
  loadCommand('./admin/sendRank');
  loadCommand('./admin/list');
  loadCommand('./admin/rm');
  loadCommand('./admin/manageFortGirls');
  loadCommand('./admin/manageJonesy');
  loadCommand('./admin/broadcast');

};
