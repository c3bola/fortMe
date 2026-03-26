const fs = require('fs');
const path = require('path');
const config = require('../../config/config'); // Configuração para acessar o grupo de logs

const dalyFiles = [
  path.join(__dirname, '../../database/dalygirl.json'),
  path.join(__dirname, '../../database/dalyjonesy.json'),
  path.join(__dirname, '../../database/dalytryhard.json'),
  path.join(__dirname, '../../database/dalyme.json')
];
const broadcastFilePath = path.join(__dirname, '../../database/broadcast.json');

module.exports = (bot) => {
  // Função para registrar logs no grupo de logs
  const logToGroup = async (message) => {
    if (config.logGroup?.id && config.logGroup?.topic) {
      try {
        await bot.telegram.sendMessage(config.logGroup.id, message, {
          parse_mode: 'Markdown',
          message_thread_id: config.logGroup.topic // Garantir envio ao tópico específico
        });
      } catch (error) {
        console.error('[ERROR] Falha ao enviar log para o grupo de logs:', error.message);
      }
    } else {
      console.error('[ERROR] Configuração do grupo de logs está ausente ou incompleta.');
    }
  };

  // Registrar grupos a partir dos arquivos daly

  // Exibir grupos registrados em formato de lista com link
// Comando removido, agora unificado em /list

  // Registrar mensagem para divulgação
  bot.command('registerMessage', async (ctx) => {
    const message = ctx.message.text.split(' ').slice(1).join(' ');

    if (!message && !ctx.message.reply_to_message) {
      return ctx.reply('Por favor, forneça uma mensagem ou responda a uma mensagem para registrar. Exemplo: /registerMessage Esta é uma mensagem de teste.');
    }

    let broadcastData = { groups: {}, message: null }; // Alterado para manter apenas uma mensagem
    if (fs.existsSync(broadcastFilePath)) {
      try {
        broadcastData = JSON.parse(fs.readFileSync(broadcastFilePath, 'utf8'));
        if (!broadcastData.message) {
          broadcastData.message = {}; // Inicializar a propriedade message, se não existir
        }
      } catch (error) {
        console.error('[ERROR] Falha ao carregar broadcast.json:', error.message);
        broadcastData = { groups: {}, message: null };
      }
    }

    const messageData = {
      text: message || null, // Unificar text e caption
      entities: null, // Preservar entidades de formatação
      fileType: null, // Tipo do arquivo (image, video, gif, etc.)
      fileId: null    // ID do arquivo (se houver)
    };

    // Verificar se há uma mensagem respondida
    if (ctx.message.reply_to_message) {
      const reply = ctx.message.reply_to_message;

      // Verificar se a mensagem respondida contém uma imagem
      if (reply.photo) {
        const photo = reply.photo.pop(); // Pega a melhor qualidade da imagem
        messageData.fileType = 'image';
        messageData.fileId = photo.file_id;
      }

      // Verificar se a mensagem respondida contém um vídeo
      if (reply.video) {
        messageData.fileType = 'video';
        messageData.fileId = reply.video.file_id;
      }

      // Verificar se a mensagem respondida contém um GIF animado
      if (reply.animation) {
        messageData.fileType = 'gif';
        messageData.fileId = reply.animation.file_id;
      }

      // Verificar se a mensagem respondida contém uma legenda
      if (reply.caption) {
        messageData.text = reply.caption; // Usar a legenda como texto
        messageData.entities = reply.caption_entities || null; // Preservar entidades da legenda
      } else if (reply.text) {
        messageData.text = reply.text; // Usar o texto
        messageData.entities = reply.entities || null; // Preservar entidades do texto
      }
    } else if (ctx.message.entities && ctx.message.entities.length > 1) {
      // Se não é reply, pegar entidades da própria mensagem (exceto o comando)
      // Ajustar offset das entidades para remover o comando
      const commandLength = ctx.message.text.split(' ')[0].length + 1; // /registerMessage + espaço
      messageData.entities = ctx.message.entities
        .filter(entity => entity.offset >= commandLength)
        .map(entity => ({
          ...entity,
          offset: entity.offset - commandLength
        }));
      if (messageData.entities.length === 0) {
        messageData.entities = null;
      }
    }

    // Atualizar a mensagem no arquivo
    broadcastData.message = messageData;
    fs.writeFileSync(broadcastFilePath, JSON.stringify(broadcastData, null, 2), 'utf8');
    const logMessage = `📋 *Comando Executado:* /registerMessage\n👤 *Usuário:* ${ctx.from.username || ctx.from.first_name}\n📝 *Mensagem Registrada:* ${messageData.text ? messageData.text.substring(0, 100) : 'Nenhuma'}...`;
    await logToGroup(logMessage);
    ctx.reply('✅ Mensagem registrada com sucesso! A formatação original foi preservada.');
  });

  // Enviar mensagem para os grupos registrados
  bot.command('sendBroadcast', async (ctx) => {
    if (!fs.existsSync(broadcastFilePath)) {
      return ctx.reply('Nenhum grupo ou mensagem registrada.');
    }

    const broadcastData = JSON.parse(fs.readFileSync(broadcastFilePath, 'utf8'));

    if (!broadcastData.message) {
      return ctx.reply('Nenhuma mensagem registrada para envio.');
    }

    const message = broadcastData.message;
    const groups = Object.values(broadcastData.groups);

    if (groups.length === 0) {
      return ctx.reply('Nenhum grupo registrado para envio.');
    }

    let successCount = 0;
    let failureCount = 0;
    const failedGroups = [];

    // Preparar opções com entidades se existirem
    const getMessageOptions = (isCaption = false) => {
      const options = {};
      
      if (message.entities && message.entities.length > 0) {
        // Usar entidades nativas do Telegram
        if (isCaption) {
          options.caption_entities = message.entities;
        } else {
          options.entities = message.entities;
        }
      }
      
      return options;
    };

    for (const group of groups) {
      try {
        if (message.fileType === 'image') {
          // Enviar uma imagem com legenda e entidades
          await bot.telegram.sendPhoto(group.id, message.fileId, {
            caption: message.text || '',
            ...getMessageOptions(true)
          });
        } else if (message.fileType === 'video') {
          // Enviar um vídeo com legenda e entidades
          await bot.telegram.sendVideo(group.id, message.fileId, {
            caption: message.text || '',
            ...getMessageOptions(true)
          });
        } else if (message.fileType === 'gif') {
          // Enviar um GIF animado com legenda e entidades
          await bot.telegram.sendAnimation(group.id, message.fileId, {
            caption: message.text || '',
            ...getMessageOptions(true)
          });
        } else if (message.text) {
          // Enviar uma mensagem de texto com entidades
          await bot.telegram.sendMessage(group.id, message.text, getMessageOptions(false));
        } else {
          console.error(`[ERROR] Mensagem inválida: Nenhum texto ou arquivo encontrado.`);
          failureCount++;
          failedGroups.push(group.name || group.id);
          continue;
        }
        successCount++;
        console.log(`[SUCCESS] Broadcast enviado para: ${group.name || group.id}`);
        
        // Delay entre mensagens para respeitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[ERROR] Erro ao enviar mensagem para o grupo ${group.id}:`, error.message);
        failureCount++;
        failedGroups.push(group.name || group.id);
      }
    }

    const logMessage = `📋 *Comando Executado:* /sendBroadcast\n👤 *Usuário:* ${ctx.from.username || ctx.from.first_name}\n✅ *Sucesso:* ${successCount}\n❌ *Falhas:* ${failureCount}`;
    await logToGroup(logMessage);
    
    let responseMsg = `✅ Mensagem enviada com sucesso para ${successCount} grupo(s).`;
    if (failureCount > 0) {
      responseMsg += `\n❌ Falha em ${failureCount} grupo(s): ${failedGroups.join(', ')}`;
    }
    ctx.reply(responseMsg);
  });
};
