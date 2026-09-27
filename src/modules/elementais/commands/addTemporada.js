'use strict';

const seasonDb = require('../db/seasonDb');
const { isAdmin } = require('../../../utils/databaseUtilsMySQL');

module.exports = (bot) => {
  bot.command(['addtemporada', 'settemporada'], async (ctx) => {
    const replyId = ctx.message?.message_id;
    const userIdStr = ctx.from.id.toString();

    try {
      if (!(await isAdmin(userIdStr))) {
        return ctx.reply('❌ Apenas administradores podem gerenciar as temporadas.', { reply_to_message_id: replyId });
      }

      const args = ctx.message.text.split(/\s+/).slice(1);
      
      // Se enviou sem nenhum parâmetro, mostra a ajuda detalhada e o exemplo
      if (args.length === 0) {
        return ctx.reply(
          '📝 <b>Como registrar uma nova temporada:</b>\n\n' +
          'Para fazer a transição, você precisa informar os dados da temporada separados por espaço. ' +
          'A nova temporada ativará automaticamente e mandará os elementais atuais para o cofre.\n\n' +
          '<b>Formato:</b>\n' +
          '<code>/addtemporada [CÓDIGO] [CAPÍTULO] [TEMPORADA] [NOME]</code>\n\n' +
          '<b>Exemplo de uso:</b>\n' +
          '<code>/addtemporada C7T4 7 4 Assuma o controle</code>',
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      // Se enviou parâmetros mas estão incompletos
      if (args.length < 4) {
        return ctx.reply(
          '❌ <b>Faltam informações!</b>\nLembre-se do formato: <code>/addtemporada [CÓDIGO] [CAPÍTULO] [TEMPORADA] [NOME]</code>', 
          { parse_mode: 'HTML', reply_to_message_id: replyId }
        );
      }

      const chapter = parseInt(args[1]);
      const seasonNumber = parseInt(args[2]);

      if (isNaN(chapter) || isNaN(seasonNumber)) {
        return ctx.reply('❌ O Capítulo e a Temporada devem ser números válidos.\nExemplo: <code>7 4</code>', { parse_mode: 'HTML', reply_to_message_id: replyId });
      }

      // Ignora o '0' ou '1' se o admin digitar por costume antigo
      let nameStartIndex = 3;
      if (args[3] === '0' || args[3] === '1') {
        nameStartIndex = 4;
      }

      const seasonData = {
        code: args[0].toUpperCase(),
        chapter,
        season_number: seasonNumber,
        name: args.slice(nameStartIndex).join(' ')
      };

      await seasonDb.addOrUpdateSeason(seasonData);
      
      await ctx.reply(
        `🏆 <b>Temporada registrada com sucesso!</b>\n\n` +
        `• ${seasonData.code} | Cap ${chapter} Temp ${seasonNumber}\n` +
        `• Nome: ${seasonData.name}\n` +
        `• Status: Ativa (Temporada anterior desativada)\n\n` +
        `🔒 <i>Todos os elementais foram enviados para o cofre desta nova temporada e não aparecerão na coleção até serem ativados!</i>`,
        { parse_mode: 'HTML', reply_to_message_id: replyId }
      );

    } catch (error) {
      console.error('[ERROR] /addtemporada:', error.message);
      await ctx.reply('❌ Erro ao registrar a temporada.', { reply_to_message_id: replyId });
    }
  });
};