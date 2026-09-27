const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../../config/config.json');
const logGroup = require('../../../config/config').logGroup;

module.exports = (bot) => {
  bot.command('registerTryhardImage', async (ctx) => {
    const replyMessage = ctx.message.reply_to_message;

    if (!replyMessage || (!replyMessage.photo && !replyMessage.animation && !replyMessage.video)) {
      return ctx.reply('Por favor, responda a uma imagem, GIF ou vídeo com o comando e adicione um dos parâmetros: tryhard!!normaly, tryhard!!hundred, banana!!normaly, banana!!hundred.');
    }

    const args = ctx.message.text.split(' ')[1];
    if (!args || !['tryhard!!normaly', 'tryhard!!hundred', 'banana!!normaly', 'banana!!hundred'].includes(args)) {
      return ctx.reply('Parâmetro inválido! Use um dos seguintes: tryhard!!normaly, tryhard!!hundred, banana!!normaly, banana!!hundred.');
    }

    // Determinar o tipo de mídia e obter o ID
    let mediaId;
    let mediaType;
    if (replyMessage.photo) {
      mediaId = replyMessage.photo.pop().file_id; // Pega a melhor qualidade da imagem
      mediaType = 'photo';
    } else if (replyMessage.animation) {
      mediaId = replyMessage.animation.file_id;
      mediaType = 'animation';
    } else if (replyMessage.video) {
      mediaId = replyMessage.video.file_id;
      mediaType = 'video';
    }

    // Ler o arquivo de configuração existente
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de configuração.');
    }

    // Atualizar o ID e o tipo da mídia no arquivo de configuração
    const [category, type] = args.split('!!');
    if (config.tryhardme[category] && config.tryhardme[category][type]) {
      config.tryhardme[category][type].imageId = mediaId;
      config.tryhardme[category][type].mediaType = mediaType;

      // Salvar a configuração atualizada
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        ctx.reply(`Mídia registrada com sucesso para ${args}! (${mediaType})`);

        // Registrar log no grupo
        if (logGroup.status) {
          const logMessage = `
            📥 <b>Mídia registrada!</b>
            🗂️ <b>Categoria:</b> ${category}
            🔖 <b>Tipo:</b> ${type}
            🎞️ <b>Tipo de Mídia:</b> ${mediaType}
            🆔 <b>ID:</b> ${mediaId}
            👤 <b>Admin:</b> ${ctx.from.username || ctx.from.first_name} (ID: ${ctx.from.id})
          `.replace(/^\s+/gm, ''); // Remove espaços extras no início das linhas

          const sendMedia = async () => {
            try {
              if (mediaType === 'photo') {
                await bot.telegram.sendPhoto(logGroup.id, mediaId, {
                  caption: logMessage,
                  parse_mode: 'HTML',
                  message_thread_id: logGroup.topic || undefined
                });
              } else if (mediaType === 'animation') {
                await bot.telegram.sendAnimation(logGroup.id, mediaId, {
                  caption: logMessage,
                  parse_mode: 'HTML',
                  message_thread_id: logGroup.topic || undefined
                });
              } else if (mediaType === 'video') {
                await bot.telegram.sendVideo(logGroup.id, mediaId, {
                  caption: logMessage,
                  parse_mode: 'HTML',
                  message_thread_id: logGroup.topic || undefined
                });
              }
            } catch (error) {
              console.error('Erro ao enviar mídia para o grupo de logs:', error.message);
            }
          };

          sendMedia();
        }
      } catch (error) {
        console.error('Erro ao salvar o arquivo de configuração:', error.message);
        ctx.reply('Erro ao salvar a configuração atualizada.');
      }
    } else {
      ctx.reply('Erro: Parâmetro inválido ou configuração não encontrada.');
    }
  });
};
