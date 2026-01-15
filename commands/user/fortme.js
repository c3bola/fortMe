const path = require('path');
const {
  readDatabase,
  writeDatabase,
  initializeGroupData,
  isGroupCommand,
  getGroupInfo
} = require('../../utils/databaseUtils');

const fortmeFilePath = path.join(__dirname, '../../database/fortme.json');
const dalymeFilePath = path.join(__dirname, '../../database/dalyme.json');
const config = require('../../config/config');
const fs = require('fs');

// Função para remover imagem inválida e registrar no log
async function removeInvalidImage(bot, imageId, imageData) {
  try {
    console.log('[WARNING] Removendo imagem com file_id inválido:', imageId);
    
    // Ler arquivo atual
    const fortmeData = JSON.parse(fs.readFileSync(fortmeFilePath, 'utf8'));
    
    // Remover item com imageId inválido
    const updatedData = fortmeData.filter(item => item.imageId !== imageId);
    
    // Salvar arquivo atualizado
    fs.writeFileSync(fortmeFilePath, JSON.stringify(updatedData, null, 2), 'utf8');
    console.log('[SUCCESS] Imagem removida do banco de dados. Total de imagens restantes:', updatedData.length);
    
    // Enviar notificação para o grupo de logs
    if (config.logGroup && config.logGroup.status) {
      const message = `⚠️ *IMAGEM INVÁLIDA REMOVIDA (FORTME)*\n\n` +
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
  bot.command('fortme', async (ctx) => {
    try {
      console.log('[DEBUG] Comando /fortme iniciado', { userId: ctx.from?.id, chatId: ctx.chat?.id });
      const now = new Date();
      const brasiliaDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000 - 3 * 3600000).toISOString().split('T')[0];
      const userId = ctx.from.id.toString();
      const username = ctx.from.username || ctx.from.first_name;
      const mention = `[${username}](tg://user?id=${userId})`;

      if (!isGroupCommand(ctx)) {
        console.log('[DEBUG] /fortme executado no privado');
        // Executado no privado, sem salvar no banco de dados
        let fortmeData = readDatabase(fortmeFilePath);
        console.log('[DEBUG] Dados carregados, total de imagens:', fortmeData.length);
        
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && fortmeData.length > 0) {
          const randomImage = fortmeData[Math.floor(Math.random() * fortmeData.length)];

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
              fortmeData = readDatabase(fortmeFilePath);
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
    const fortmeData = readDatabase(fortmeFilePath);
    const dalymeData = readDatabase(dalymeFilePath);

    // Inicializar a estrutura de dados com o nome do grupo
    initializeGroupData(dalymeData, groupInfo.id, brasiliaDate, groupInfo.name);

    if (dalymeData[groupInfo.id][brasiliaDate][userId]) {
      const userEntry = dalymeData[groupInfo.id][brasiliaDate][userId];
      return ctx.reply(`🎯 Ei ${mention}, sua sorte já foi tirada hoje!`, {
        reply_to_message_id: userEntry.message_id,
        parse_mode: 'Markdown'
      });
    }

    const usedImages = Object.values(dalymeData[groupInfo.id][brasiliaDate]).map(entry => entry.imageId);
    const availableImages = fortmeData.filter(image => !usedImages.includes(image.imageId));

    if (availableImages.length === 0) {
      return ctx.reply('🚨 Você chegou tarde! As sortes já acabaram! Tente amanhã mais cedo! ⏰');
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
      const heartCallback = `hfm|${groupInfo.id}|${brasiliaDate}|${userId}`;
      const hatCallback = `xfm|${groupInfo.id}|${brasiliaDate}|${userId}`;

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
          const fortmeData = readDatabase(fortmeFilePath);
          const usedImages = Object.values(dalymeData[groupInfo.id][brasiliaDate]).map(entry => entry.imageId);
          availableImages = fortmeData.filter(image => !usedImages.includes(image.imageId));
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

    dalymeData[groupInfo.id][brasiliaDate][userId] = {
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

    writeDatabase(dalymeFilePath, dalymeData);
    console.log('[DEBUG] /fortme concluído com sucesso');
    } catch (error) {
      console.error('[ERROR] Erro no comando /fortme:', error.message);
      console.error('[ERROR] Stack trace:', error.stack);
      try {
        await ctx.reply('❌ Ocorreu um erro ao processar o comando. Tente novamente.');
      } catch (replyError) {
        console.error('[ERROR] Falha ao enviar mensagem de erro:', replyError.message);
      }
    }
  });

  bot.action(/(hfm|xfm)\|(.+)\|(.+)\|(.+)/, async (ctx) => {
    const [action, groupId, brasiliaDate, userId] = ctx.match.slice(1);
    const voterId = ctx.from.id.toString();

    const dalymeData = readDatabase(dalymeFilePath);

    const userEntry = dalymeData[groupId]?.[brasiliaDate]?.[userId];
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
        if (previousVote === 'hfm') {
          userEntry.rating.heart -= 1;
        } else if (previousVote === 'xfm') {
          userEntry.rating.hat -= 1;
        }

        userEntry.voters[existingVoteIndex].vote = action;
      } else {
        // Adicionar novo voto
        userEntry.voters.push({ id: voterId, vote: action });
      }

      // Atualizar o contador de votos
      if (action === 'hfm') {
        userEntry.rating.heart += 1;
        try {
          ctx.answerCbQuery('❤️ Você curtiu esta sorte!', { show_alert: true });
        } catch (error) {
          console.error('[ERROR] Falha ao responder callbackQuery (heart):', error.message);
        }
      } else if (action === 'xfm') {
        userEntry.rating.hat += 1;
        try {
          ctx.answerCbQuery('😡 Você não gostou desta sorte!', { show_alert: true });
        } catch (error) {
          console.error('[ERROR] Falha ao responder callbackQuery (hat):', error.message);
        }
      }

      writeDatabase(dalymeFilePath, dalymeData);

      // Atualizar os botões com os votos
      const updatedButtons = [
        [
          { text: `❤️ ${userEntry.rating.heart}`, callback_data: `hfm|${groupId}|${brasiliaDate}|${userId}` },
          { text: `😡 ${userEntry.rating.hat}`, callback_data: `xfm|${groupId}|${brasiliaDate}|${userId}` }
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
