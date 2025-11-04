const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../database/fortjonesy.json');
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
  bot.command('registerFortJonesy', async (ctx) => {
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
        jsonData = JSON.parse(fileContent) || [];
        if (!Array.isArray(jsonData)) {
          throw new Error('O conteúdo do arquivo não é um array.');
        }
      }
    } catch (error) {
      console.error('Erro ao ler ou inicializar o arquivo fortjonesy.json:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de dados. Verifique o formato do arquivo.');
    }

    // Gerar um ID único
    const newId = jsonData.length > 0 ? Math.max(...jsonData.map(item => item.id)) + 1 : 1;

    const data = {
      id: newId,
      imageId: photo.file_id,
      dateAdded: new Date().toISOString(),
      text: caption, // Salvar a legenda passada no comando
      name: name || null, // Salvar apenas o nome extraído da imagem respondida
      status: true,
      adminName: adminName,
      adminId: adminId
    };

    jsonData.push(data);
    try {
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    } catch (error) {
      console.error('Erro ao salvar o arquivo fortjonesy.json:', error.message);
      return ctx.reply('Erro ao salvar os dados no arquivo.');
    }

    ctx.reply(`Imagem registrada com sucesso no arquivo fortjonesy.json com ID ${newId}!`);

    // Enviar log para o grupo de logs
    if (logGroup.status) {
      const escapedCaption = escapeMarkdown(caption);
      const escapedName = escapeMarkdown(name || 'Não especificado');
      const escapedAdminName = escapeMarkdown(adminName);

      bot.telegram.sendPhoto(logGroup.id, photo.file_id, {
        caption: `📥 *Nova imagem registrada!*\n\n🆔 *ID*: ${newId}\n📅 *Data*: ${data.dateAdded}\n✏️ *Texto*: ${escapedCaption}\n👤 *Admin*: ${escapedAdminName} (ID: ${adminId})\n🏷️ *Nome*: ${escapedName}`,
        parse_mode: 'Markdown',
        message_thread_id: logGroup.topic || undefined
      }).catch((error) => {
        console.error('Erro ao enviar log para o grupo de logs:', error.message);
      });
    }
  });
};
