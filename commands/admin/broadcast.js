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
  bot.command('registerGroups', async (ctx) => {
    let groupIds = new Set();
    let groupNames = {};

    // Ler todos os arquivos daly e coletar os IDs e nomes dos grupos
    dalyFiles.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        try {
          const dalyData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          Object.keys(dalyData).forEach((groupId) => {
            groupIds.add(groupId);
            if (dalyData[groupId]?.name) {
              groupNames[groupId] = dalyData[groupId].name;
            }
          });
        } catch (error) {
          console.error(`[ERROR] Falha ao carregar ${filePath}:`, error.message);
        }
      }
    });

    // Inicializar a estrutura de broadcastData
    let broadcastData = { groups: {}, messages: [] };
    if (fs.existsSync(broadcastFilePath)) {
      try {
        broadcastData = JSON.parse(fs.readFileSync(broadcastFilePath, 'utf8'));
        if (!broadcastData.groups) {
          broadcastData.groups = {};
        }
      } catch (error) {
        console.error('[ERROR] Falha ao carregar broadcast.json:', error.message);
        broadcastData = { groups: {}, messages: [] };
      }
    }

    // Registrar os grupos no broadcast.json
    groupIds.forEach((groupId) => {
      if (!broadcastData.groups[groupId]) {
        broadcastData.groups[groupId] = {
          id: groupId,
          name: groupNames[groupId] || `Grupo ${groupId}` // Usar o nome do grupo dos arquivos daly ou um nome padrão
        };
      }
    });

    fs.writeFileSync(broadcastFilePath, JSON.stringify(broadcastData, null, 2), 'utf8');
    // const logMessage = `📋 *Comando Executado:* /registerGroups\n👤 *Usuário:* ${ctx.from.username || ctx.from.first_name}\n✅ *Grupos Registrados:* ${groupIds.size}`;
    await logToGroup(logMessage);
    ctx.reply(`Grupos registrados com sucesso! Total de grupos: ${groupIds.size}`);
  });

  // Exibir grupos registrados com botões
  bot.command('listGroups', async (ctx) => {
    if (!fs.existsSync(broadcastFilePath)) {
      return ctx.reply('Nenhum grupo registrado.');
    }

    const broadcastData = JSON.parse(fs.readFileSync(broadcastFilePath, 'utf8'));
    const groupButtons = Object.values(broadcastData.groups).map((group) => [
      { text: group.name, callback_data: `group_${group.id}` }
    ]);

    if (groupButtons.length === 0) {
      return ctx.reply('Nenhum grupo registrado.');
    }

    const logMessage = `📋 *Comando Executado:* /listGroups\n👤 *Usuário:* ${ctx.from.username || ctx.from.first_name}`;
    await logToGroup(logMessage);
    ctx.reply('Grupos registrados:', {
      reply_markup: {
        inline_keyboard: groupButtons
      }
    });
  });

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
      }
    }

    // Atualizar a mensagem no arquivo
    broadcastData.message = messageData;
    fs.writeFileSync(broadcastFilePath, JSON.stringify(broadcastData, null, 2), 'utf8');
    const logMessage = `📋 *Comando Executado:* /registerMessage\n👤 *Usuário:* ${ctx.from.username || ctx.from.first_name}\n📝 *Mensagem Registrada:* ${messageData.text || 'Nenhuma'}`;
    await logToGroup(logMessage);
    ctx.reply('Mensagem registrada com sucesso!');
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

    for (const group of groups) {
      try {
        if (message.fileType === 'image') {
          // Enviar uma imagem com legenda
          await bot.telegram.sendPhoto(group.id, message.fileId, {
            caption: message.text || '',
            parse_mode: 'Markdown'
          });
        } else if (message.fileType === 'video') {
          // Enviar um vídeo com legenda
          await bot.telegram.sendVideo(group.id, message.fileId, {
            caption: message.text || '',
            parse_mode: 'Markdown'
          });
        } else if (message.fileType === 'gif') {
          // Enviar um GIF animado
          await bot.telegram.sendAnimation(group.id, message.fileId, {
            caption: message.text || '',
            parse_mode: 'Markdown'
          });
        } else if (message.text) {
          // Enviar uma mensagem de texto
          await bot.telegram.sendMessage(group.id, message.text, { parse_mode: 'Markdown' });
        } else {
          console.error(`[ERROR] Mensagem inválida: Nenhum texto ou arquivo encontrado.`);
          failureCount++;
          continue;
        }
        successCount++;
      } catch (error) {
        console.error(`Erro ao enviar mensagem para o grupo ${group.id}:`, error.message);
        failureCount++;
      }
    }

    const logMessage = `📋 *Comando Executado:* /sendBroadcast\n👤 *Usuário:* ${ctx.from.username || ctx.from.first_name}\n✅ *Sucesso:* ${successCount}\n❌ *Falhas:* ${failureCount}`;
    await logToGroup(logMessage);
    ctx.reply(`Mensagem enviada com sucesso para ${successCount} grupos. Falha em ${failureCount} grupos.`);
  });
};
