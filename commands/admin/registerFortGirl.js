const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../database/fortgirl.json');
const logGroup = require('../../config/config').logGroup;

// Função para limpar e extrair o nome da legenda
const extractNameFromCaption = (caption) => {
  const cleanCaption = caption.replace(/<\/?[^>]+(>|$)/g, ''); // Remove tags HTML
  const nameMatch = cleanCaption.match(/Nome:\s*(.+)/i);
  return nameMatch ? nameMatch[1].trim() : null;
};

// Função para escapar caracteres especiais no Markdown
const escapeMarkdown = (text) => {
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/~/g, '\\~')
    .replace(/\|/g, '\\|');
};

module.exports = (bot) => {
  bot.command('registerFortGirl', async (ctx) => {
    try {
      console.log('[DEBUG] Comando /registerFortGirl iniciado', { userId: ctx.from?.id });
      if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
        return ctx.reply('Por favor, responda a uma imagem com o comando e adicione um texto como legenda.');
      }

    const photo = ctx.message.reply_to_message.photo.pop(); // Pega a melhor qualidade da imagem
    const caption = ctx.message.text.split(' ').slice(1).join(' '); // Captura a legenda passada no comando
    const adminName = ctx.from.username || ctx.from.first_name;
    const adminId = ctx.from.id;

    if (!caption) {
      return ctx.reply('Por favor, forneça uma legenda no comando.');
    }

    // Extrair o nome da legenda da imagem respondida
    const imageCaption = ctx.message.reply_to_message.caption || '';
    const name = extractNameFromCaption(imageCaption);

    // Ler o arquivo existente
    let jsonData = [];
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        jsonData = JSON.parse(fileContent);
        if (!Array.isArray(jsonData)) {
          console.error('[ERROR] fortgirl.json não é um array válido');
          return ctx.reply('❌ Erro: O arquivo de dados está corrompido.');
        }
        console.log('[DEBUG] Arquivo fortgirl.json carregado, total de imagens:', jsonData.length);
      }
    } catch (readError) {
      console.error('[ERROR] Falha ao ler fortgirl.json:', readError.message);
      return ctx.reply('❌ Erro ao ler o arquivo de dados. Verifique o formato do arquivo.');
    }

    // Verificar se já existe uma imagem com o mesmo imageId
    const existingIndex = jsonData.findIndex(item => item.imageId === photo.file_id);
    let usedId;
    const now = new Date().toISOString();
    if (existingIndex !== -1) {
      // Atualizar dados existentes
      usedId = jsonData[existingIndex].id;
      jsonData[existingIndex] = {
        ...jsonData[existingIndex],
        imageId: photo.file_id,
        dateAdded: now,
        text: caption,
        name: name || null,
        status: true,
        adminName: adminName,
        adminId: adminId
      };
    } else {
      // Gerar um ID único
      usedId = jsonData.length > 0 ? Math.max(...jsonData.map(item => item.id)) + 1 : 1;
      const data = {
        id: usedId,
        imageId: photo.file_id,
        dateAdded: now,
        text: caption,
        name: name || null,
        status: true,
        adminName: adminName,
        adminId: adminId
      };
      jsonData.push(data);
    }
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
      console.log('[DEBUG] Imagem registrada com sucesso, ID:', usedId, 'imageId:', photo.file_id);
    } catch (writeError) {
      console.error('[ERROR] Falha ao salvar fortgirl.json:', writeError.message);
      return ctx.reply('❌ Erro ao salvar a imagem no arquivo.');
    }

    ctx.reply(`Imagem registrada com sucesso no arquivo fortgirl.json com ID ${usedId}!`);

    // Enviar log para o grupo de logs
    if (logGroup.status) {
      const escapedCaption = escapeMarkdown(caption);
      const escapedName = escapeMarkdown(name || 'Não especificado');
      const escapedAdminName = escapeMarkdown(adminName);

      bot.telegram.sendPhoto(logGroup.id, photo.file_id, {
        caption: `📥 *Imagem registrada/atualizada!*\n\n🆔 *ID*: ${usedId}\n📅 *Data*: ${now}\n✏️ *Texto*: ${escapedCaption}\n👤 *Admin*: ${escapedAdminName} (ID: ${adminId})\n🏷️ *Nome*: ${escapedName}`,
        parse_mode: 'Markdown',
        message_thread_id: logGroup.topic || undefined
      }).catch((error) => {
        console.error('[ERROR] Erro ao enviar log para o grupo de logs:', error.message);
      });
    }
    } catch (error) {
      console.error('[ERROR] Erro no comando /registerFortGirl:', error.message);
      console.error('[ERROR] Stack trace:', error.stack);
      try {
        await ctx.reply('❌ Ocorreu um erro ao registrar a imagem. Verifique os logs.');
      } catch (replyError) {
        console.error('[ERROR] Falha ao enviar mensagem de erro:', replyError.message);
      }
    }
  });
};
