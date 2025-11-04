const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config/config.json');

module.exports = (bot) => {
  bot.command('addAdmin', async (ctx) => {
    const message = ctx.message.text.split(' ');

    if (message.length < 2) {
      return ctx.reply('Por favor, forneça o ID e o nome no formato: id!!nome do adm ou mencione o usuário com @.');
    }

    const param = message[1];

    let adminId, adminName;

    if (param.includes('!!')) {
      // Formato id!!nome do adm
      [adminId, adminName] = param.split('!!');
    } else if (param.startsWith('@')) {
      // Formato @menção
      if (ctx.chat.type === 'private') {
        return ctx.reply('No privado, forneça o ID e o nome no formato: id!!nome do adm. Exemplo: /addAdmin 123456!!embananaeiro');
      }

      const mentionedUser = ctx.message.entities?.find(entity => entity.type === 'mention');
      if (!mentionedUser) {
        return ctx.reply('Erro: Não foi possível identificar o usuário mencionado.');
      }

      // Obter o ID do usuário mencionado
      const mentionedUsername = param.replace('@', '');
      const mentionedUserId = ctx.message.reply_to_message?.from?.id;

      if (!mentionedUserId) {
        return ctx.reply('Erro: Não foi possível obter o ID do usuário mencionado.');
      }

      adminId = mentionedUserId;
      adminName = mentionedUsername;
    } else {
      return ctx.reply('Formato inválido! Use id!!nome do adm ou mencione o usuário com @.');
    }

    if (!adminId || !adminName) {
      return ctx.reply('Erro: Certifique-se de fornecer o ID e o nome corretamente.');
    }

    // Ler o arquivo de configuração existente
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de configuração.');
    }

    // Verificar se o administrador já está registrado
    if (config.admins.some(admin => admin.id.toString() === adminId.toString())) {
      return ctx.reply(`O administrador com ID ${adminId} já está registrado.`);
    }

    // Adicionar o novo administrador
    config.admins.push({
      id: parseInt(adminId, 10),
      name: adminName
    });

    // Salvar a configuração atualizada
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      ctx.reply(`Administrador "${adminName}" com ID ${adminId} adicionado com sucesso!`);

      // Log the action in the log group
      if (config.logGroup?.id && config.logGroup?.topic) {
        const logMessage = `✅ *Novo Administrador Adicionado:*\n` +
          `👤 *Nome:* ${adminName}\n` +
          `🆔 *ID:* ${adminId}\n` +
          `👤 *Adicionado por:* ${ctx.from.username || ctx.from.first_name} (ID: ${ctx.from.id})\n` +
          `🕒 *Horário:* ${new Date().toLocaleString('pt-BR')}`;
        await bot.telegram.sendMessage(config.logGroup.id, logMessage, {
          parse_mode: 'Markdown',
          message_thread_id: config.logGroup.topic
        });
      }
    } catch (error) {
      console.error('Erro ao salvar o arquivo de configuração:', error.message);
      ctx.reply('Erro ao salvar a configuração atualizada.');
    }
  });
};
