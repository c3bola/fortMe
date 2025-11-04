const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config/config.json');

module.exports = (bot) => {
  bot.command('watchGroup', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1).join(' '); // Capturar tudo após o comando

    if (!args || !args.includes('!!')) {
      return ctx.reply('Uso inválido! O formato correto é: /watchGroup id!!nome do grupo');
    }

    const [groupId, ...groupNameParts] = args.split('!!');
    const groupName = groupNameParts.join('!!').trim(); // Reunir o nome do grupo, caso contenha "!!"

    if (!groupId || !groupName) {
      return ctx.reply('Erro: Certifique-se de fornecer o ID e o nome do grupo no formato: id!!nome do grupo');
    }

    // Ler o arquivo de configuração existente
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de configuração.');
    }

    // Verificar se o grupo já está registrado
    const existingGroup = config.groups.find(group => group.id.toString() === groupId);
    if (existingGroup) {
      return ctx.reply(`O grupo com ID ${groupId} já está registrado como "${existingGroup.name}".`);
    }

    // Adicionar o novo grupo
    config.groups.push({
      id: parseInt(groupId, 10),
      name: groupName,
      status: true
    });

    // Salvar a configuração atualizada
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      ctx.reply(`Grupo "${groupName}" com ID ${groupId} adicionado com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar o arquivo de configuração:', error.message);
      ctx.reply('Erro ao salvar a configuração atualizada.');
    }
  });
};
