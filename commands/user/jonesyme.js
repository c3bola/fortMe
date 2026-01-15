const path = require('path');
const {
  readDatabase,
  writeDatabase,
  initializeGroupData,
  isGroupCommand,
  getGroupInfo
} = require('../../utils/databaseUtils');

const fortjonesyFilePath = path.join(__dirname, '../../database/fortjonesy.json');
const dalyjonesyFilePath = path.join(__dirname, '../../database/dalyjonesy.json');
const config = require('../../config/config');
const fs = require('fs');

// Função para remover imagem inválida e registrar no log
async function removeInvalidImage(bot, imageId, imageData) {
  try {
    console.log('[WARNING] Removendo imagem com file_id inválido:', imageId);
    
    // Ler arquivo atual
    const fortjonesyData = JSON.parse(fs.readFileSync(fortjonesyFilePath, 'utf8'));
    
    // Remover item com imageId inválido
    const updatedData = fortjonesyData.filter(item => item.imageId !== imageId);
    
    // Salvar arquivo atualizado
    fs.writeFileSync(fortjonesyFilePath, JSON.stringify(updatedData, null, 2), 'utf8');
    console.log('[SUCCESS] Imagem removida do banco de dados. Total de imagens restantes:', updatedData.length);
    
    // Enviar notificação para o grupo de logs
    if (config.logGroup && config.logGroup.status) {
      const message = `⚠️ *IMAGEM INVÁLIDA REMOVIDA (JONESY)*\n\n` +
        `🆔 *ID*: ${imageData.id}\n` +
        `📷 *File ID*: \`${imageId}\`\n` +
        `✏️ *Texto*: ${imageData.text || 'N/A'}\n` +
        `🏷️ *Nome*: ${imageData.name || 'N/A'}\n` +
        `📅 *Data de adição*: ${imageData.dateAdded || 'N/A'}\n` +
        `👤 *Admin*: ${imageData.adminName || 'N/A'}\n\n` +
        `❌ O file_id desta imagem não é mais válido no Telegram e foi removido do banco de dados.`;
      
      await bot.telegram.sendMessage(config.logGroup.id, message, {
        parse_mode: 'Markdown',
        message_thread_id: config.logGroup.topic || undefined
      }).catch(err => console.error('[ERROR] Falha ao enviar log de remoção:', err.message));
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] Falha ao remover imagem inválida:', error.message);
    return false;
  }
}

module.exports = (bot) => {
  bot.command('jonesyme', async (ctx) => {
    try {
      console.log('[DEBUG] Comando /jonesyme iniciado', { userId: ctx.from?.id, chatId: ctx.chat?.id });
      const now = new Date();
      const brasiliaDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000 - 3 * 3600000).toISOString().split('T')[0];
      const userId = ctx.from.id.toString();
      const username = ctx.from.username || ctx.from.first_name;
      const mention = `[${username}](tg://user?id=${userId})`;

      if (!isGroupCommand(ctx)) {
        console.log('[DEBUG] /jonesyme executado no privado');
        // Executado no privado, sem salvar no banco de dados
        let fortjonesyData = readDatabase(fortjonesyFilePath);
        console.log('[DEBUG] Dados carregados, total de imagens:', fortjonesyData.length);
        
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && fortjonesyData.length > 0) {
          const randomImage = fortjonesyData[Math.floor(Math.random() * fortjonesyData.length)];

          // Validar o imageId antes de enviar
          if (!randomImage || !randomImage.imageId || typeof randomImage.imageId !== 'string') {
            console.error('[ERROR] Imagem inválida detectada no privado:', randomImage);
            return ctx.reply('Erro: Não foi possível encontrar uma imagem válida. Verifique o banco de dados.');
          }

          console.log('[DEBUG] Tentativa', attempts + 1, '- Enviando imagem no privado, imageId:', randomImage.imageId);
          try {
            return await ctx.replyWithPhoto(randomImage.imageId, {
              caption: randomImage.text.replace('{user}', mention),
              parse_mode: 'Markdown'
            });
          } catch (photoError) {
            console.error('[ERROR] Falha ao enviar foto no privado (tentativa ' + (attempts + 1) + '):', photoError.message);
            
            // Se o erro for de file_id inválido, remover e tentar novamente
            if (photoError.message.includes('wrong file identifier') || photoError.message.includes('file_id')) {
              await removeInvalidImage(bot, randomImage.imageId, randomImage);
              // Recarregar dados após remoção
              fortjonesyData = readDatabase(fortjonesyFilePath);
              attempts++;
            } else {
              return ctx.reply('❌ Erro ao enviar a imagem. Tente novamente mais tarde.');
            }
          }
        }
        
        return ctx.reply('❌ Não foi possível enviar nenhuma imagem válida. Entre em contato com o administrador.');
      }

    // Executado em grupo, salvar no banco de dados
    const groupInfo = getGroupInfo(ctx);
    const fortjonesyData = readDatabase(fortjonesyFilePath);
    const dalyjonesyData = readDatabase(dalyjonesyFilePath);

    // Inicializar a estrutura de dados com o nome do grupo
    initializeGroupData(dalyjonesyData, groupInfo.id, brasiliaDate, groupInfo.name);

    if (dalyjonesyData[groupInfo.id][brasiliaDate][userId]) {
      const userEntry = dalyjonesyData[groupInfo.id][brasiliaDate][userId];
      return ctx.reply(`🎯 Ei ${mention}, sua skin tá aqui! Dá uma olhada e arrasa no lobby! 🕹️`, {
        reply_to_message_id: userEntry.message_id,
        parse_mode: 'Markdown'
      });
    }

    const usedImages = Object.values(dalyjonesyData[groupInfo.id][brasiliaDate]).map(entry => entry.imageId);
    const availableImages = fortjonesyData.filter(image => !usedImages.includes(image.imageId));

    if (availableImages.length === 0) {
      return ctx.reply('🚨 Você chegou tarde! As skins já acabaram! Tente amanhã mais cedo! ⏰');
    }

    let attempts = 0;
    const maxAttempts = 3;
    let sentMessage;
    let selectedImage;
    
    while (attempts < maxAttempts && availableImages.length > 0) {
      selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];

      // Validar o imageId antes de enviar
      if (!selectedImage || !selectedImage.imageId || typeof selectedImage.imageId !== 'string') {
        console.error('[ERROR] Imagem inválida detectada no grupo:', selectedImage);
        return ctx.reply('Erro: Não foi possível encontrar uma imagem válida. Verifique o banco de dados.');
      }

      console.log('[DEBUG] Tentativa', attempts + 1, '- Enviando imagem no grupo, imageId:', selectedImage.imageId);
      const heartCallback = `h|${groupInfo.id}|${brasiliaDate}|${userId}`;
      const hatCallback = `x|${groupInfo.id}|${brasiliaDate}|${userId}`;

      try {
        sentMessage = await ctx.replyWithPhoto(selectedImage.imageId, {
          caption: selectedImage.text.replace('{user}', mention),
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
        console.log('[DEBUG] Imagem enviada com sucesso, messageId:', sentMessage.message_id);
        break; // Sucesso, sair do loop
      } catch (photoError) {
        console.error('[ERROR] Falha ao enviar foto no grupo (tentativa ' + (attempts + 1) + '):', photoError.message, 'imageId:', selectedImage.imageId);
        
        // Se o erro for de file_id inválido, remover e tentar novamente
        if (photoError.message.includes('wrong file identifier') || photoError.message.includes('file_id')) {
          await removeInvalidImage(bot, selectedImage.imageId, selectedImage);
          // Recarregar imagens disponíveis após remoção
          const fortjonesyData = readDatabase(fortjonesyFilePath);
          const usedImages = Object.values(dalyjonesyData[groupInfo.id][brasiliaDate]).map(entry => entry.imageId);
          availableImages = fortjonesyData.filter(image => !usedImages.includes(image.imageId));
          attempts++;
        } else {
          return ctx.reply('❌ Erro ao enviar a imagem. Tente novamente mais tarde.');
        }
      }
    }
    
    if (!sentMessage) {
      return ctx.reply('❌ Não foi possível enviar nenhuma imagem válida. Entre em contato com o administrador.');
    }
    
    const randomImage = selectedImage;

    dalyjonesyData[groupInfo.id][brasiliaDate][userId] = {
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

    writeDatabase(dalyjonesyFilePath, dalyjonesyData);
    console.log('[DEBUG] /jonesyme concluído com sucesso');
    } catch (error) {
      console.error('[ERROR] Erro no comando /jonesyme:', error.message);
      console.error('[ERROR] Stack trace:', error.stack);
      try {
        await ctx.reply('❌ Ocorreu um erro ao processar o comando. Tente novamente.');
      } catch (replyError) {
        console.error('[ERROR] Falha ao enviar mensagem de erro:', replyError.message);
      }
    }
  });

  bot.action(/(h|x)\|(.+)\|(.+)\|(.+)/, async (ctx) => {
    const [action, groupId, brasiliaDate, userId] = ctx.match.slice(1);
    const voterId = ctx.from.id.toString();

    const dalyjonesyData = readDatabase(dalyjonesyFilePath);

    const userEntry = dalyjonesyData[groupId]?.[brasiliaDate]?.[userId];
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

      writeDatabase(dalyjonesyFilePath, dalyjonesyData);

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
