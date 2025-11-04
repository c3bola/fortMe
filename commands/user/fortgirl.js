const path = require('path');
const {
  readDatabase,
  writeDatabase,
  initializeGroupData,
  isGroupCommand,
  getGroupInfo
} = require('../../utils/databaseUtils');

const fortgirlFilePath = path.join(__dirname, '../../database/fortgirl.json');
const dalygirlFilePath = path.join(__dirname, '../../database/dalygirl.json');

module.exports = (bot) => {
  bot.command('fortgirl', async (ctx) => {
    const now = new Date();
    const brasiliaDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000 - 3 * 3600000).toISOString().split('T')[0];
    const userId = ctx.from.id.toString();
    const username = ctx.from.username || ctx.from.first_name;
    const mention = `[${username}](tg://user?id=${userId})`;

    if (!isGroupCommand(ctx)) {
      // Executado no privado, sem salvar no banco de dados
      const fortgirlData = readDatabase(fortgirlFilePath);
      const randomImage = fortgirlData[Math.floor(Math.random() * fortgirlData.length)];

      // Validar o imageId antes de enviar
      if (!randomImage || !randomImage.imageId || typeof randomImage.imageId !== 'string') {
        return ctx.reply('Erro: Não foi possível encontrar uma imagem válida. Verifique o banco de dados.');
      }

      return ctx.replyWithPhoto(randomImage.imageId, {
        caption: randomImage.text.replace('{user}', mention),
        parse_mode: 'Markdown'
      });
    }

    // Executado em grupo, salvar no banco de dados
    const groupInfo = getGroupInfo(ctx);
    const fortgirlData = readDatabase(fortgirlFilePath);
    const dalygirlData = readDatabase(dalygirlFilePath);

    // Inicializar a estrutura de dados com o nome do grupo
    initializeGroupData(dalygirlData, groupInfo.id, brasiliaDate, groupInfo.name);

    if (dalygirlData[groupInfo.id][brasiliaDate][userId]) {
      const userEntry = dalygirlData[groupInfo.id][brasiliaDate][userId];
      return ctx.reply(`🎯 Ei ${mention}, sua skin tá aqui! Dá uma olhada e arrasa no lobby! 🕹️`, {
        reply_to_message_id: userEntry.message_id,
        parse_mode: 'Markdown'
      });
    }

    const usedImages = Object.values(dalygirlData[groupInfo.id][brasiliaDate]).map(entry => entry.imageId);
    const availableImages = fortgirlData.filter(image => !usedImages.includes(image.imageId));

    if (availableImages.length === 0) {
      return ctx.reply('🚨 Você chegou tarde! As skins já acabaram! Tente amanhã mais cedo! ⏰');
    }

    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];

    // Validar o imageId antes de enviar
    if (!randomImage || !randomImage.imageId || typeof randomImage.imageId !== 'string') {
      return ctx.reply('Erro: Não foi possível encontrar uma imagem válida. Verifique o banco de dados.');
    }

    const heartCallback = `h|${groupInfo.id}|${brasiliaDate}|${userId}`;
    const hatCallback = `x|${groupInfo.id}|${brasiliaDate}|${userId}`;

    const sentMessage = await ctx.replyWithPhoto(randomImage.imageId, {
      caption: randomImage.text.replace('{user}', mention),
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❤️', callback_data: heartCallback },
            { text: '😡', callback_data: hatCallback }
          ]
        ]
      },
      parse_mode: 'Markdown'
    });

    dalygirlData[groupInfo.id][brasiliaDate][userId] = {
      message_id: sentMessage.message_id,
      nome: username,
      imageId: randomImage.imageId,
      legenda: randomImage.text,
      rating: {
        heart: 0,
        hat: 0
      },
      voters: []
    };

    writeDatabase(dalygirlFilePath, dalygirlData);
  });

  bot.action(/(h|x)\|(.+)\|(.+)\|(.+)/, async (ctx) => {
    const [action, groupId, brasiliaDate, userId] = ctx.match.slice(1);
    const voterId = ctx.from.id.toString();

    const dalygirlData = readDatabase(dalygirlFilePath);

    const userEntry = dalygirlData[groupId]?.[brasiliaDate]?.[userId];
    if (userEntry) {
      const existingVoteIndex = userEntry.voters.findIndex(voter => voter.id === voterId);

      if (existingVoteIndex !== -1) {
        const previousVote = userEntry.voters[existingVoteIndex].vote;

        if (previousVote === action) {
          // Se o voto for o mesmo, não faz nada
          try {
            return ctx.answerCbQuery('⚠️ Você já votou nesta opção!', { show_alert: true });
          } catch (error) {
            console.error('[ERROR] Falha ao responder callbackQuery (voto repetido):', error.message);
          }
        }

        // Transferir o voto para a outra opção
        if (previousVote === 'h') {
          userEntry.rating.heart -= 1;
        } else if (previousVote === 'x') {
          userEntry.rating.hat -= 1;
        }

        userEntry.voters[existingVoteIndex].vote = action;
      } else {
        // Adicionar novo voto
        userEntry.voters.push({ id: voterId, vote: action });
      }

      // Atualizar o contador de votos
      if (action === 'h') {
        userEntry.rating.heart += 1;
        try {
          ctx.answerCbQuery('❤️ Você curtiu esta skin!', { show_alert: true });
        } catch (error) {
          console.error('[ERROR] Falha ao responder callbackQuery (heart):', error.message);
        }
      } else if (action === 'x') {
        userEntry.rating.hat += 1;
        try {
          ctx.answerCbQuery('😡 Você não gostou desta skin!', { show_alert: true });
        } catch (error) {
          console.error('[ERROR] Falha ao responder callbackQuery (hat):', error.message);
        }
      }

      writeDatabase(dalygirlFilePath, dalygirlData);

      // Atualizar os botões com os votos
      const updatedButtons = [
        [
          { text: `❤️ ${userEntry.rating.heart}`, callback_data: `h|${groupId}|${brasiliaDate}|${userId}` },
          { text: `😡 ${userEntry.rating.hat}`, callback_data: `x|${groupId}|${brasiliaDate}|${userId}` }
        ]
      ];

      try {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: updatedButtons
        });
      } catch (error) {
        console.error('[ERROR] Falha ao atualizar os botões:', error.message);
      }
    } else {
      try {
        ctx.answerCbQuery('❌ Não foi possível registrar sua avaliação. Tente novamente.', { show_alert: true });
      } catch (error) {
        console.error('[ERROR] Falha ao responder callbackQuery (erro):', error.message);
      }
    }
  });
};
