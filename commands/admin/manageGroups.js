const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config/config.json');

module.exports = (bot) => {
  console.log('Carregando o comando /manageGroups...');
  bot.command('manageGroups', async (ctx) => {
    // Ler o arquivo de configuração existente
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      return ctx.reply('Erro ao acessar o arquivo de configuração.');
    }

    // Construir os botões
    const buttons = [
      [{ text: 'Nome', callback_data: 'header' }, { text: '👀', callback_data: 'header' }, { text: '🗑', callback_data: 'header' }]
    ];

    config.groups.forEach((group) => {
      buttons.push([
        { text: group.name, callback_data: `name_${group.id}` },
        { text: group.status ? '✅' : '☑️', callback_data: `mgs_${group.id}` },
        { text: '🗑', callback_data: `mgd_${group.id}` }
      ]);
    });

    // Enviar a mensagem com os botões
    await ctx.reply('Gerenciamento de Grupos:', {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  });

  // Callback para alternar o status do grupo
  bot.action(/mgs_(.+)/, async (ctx) => {
    const groupId = ctx.match[1];

    // Ler o arquivo de configuração existente
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      return ctx.answerCbQuery('Erro ao acessar o arquivo de configuração.');
    }

    // Alternar o status do grupo
    const group = config.groups.find(group => group.id.toString() === groupId);
    if (group) {
      group.status = !group.status;

      // Salvar a configuração atualizada
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

        // Atualizar os botões
        const buttons = [
          [{ text: 'Nome', callback_data: 'header' }, { text: '👀', callback_data: 'header' }, { text: '🗑', callback_data: 'header' }]
        ];
        config.groups.forEach((group) => {
          buttons.push([
            { text: group.name, callback_data: `name_${group.id}` },
            { text: group.status ? '✅' : '☑️', callback_data: `mgs_${group.id}` },
            { text: '🗑', callback_data: `mgd_${group.id}` }
          ]);
        });

        await ctx.editMessageReplyMarkup({
          inline_keyboard: buttons
        });

        return ctx.answerCbQuery(`Status do grupo "${group.name}" atualizado para ${group.status ? 'Ativo' : 'Inativo'}.`);
      } catch (error) {
        console.error('Erro ao salvar o arquivo de configuração:', error.message);
        return ctx.answerCbQuery('Erro ao salvar a configuração atualizada.');
      }
    } else {
      return ctx.answerCbQuery('Grupo não encontrado.');
    }
  });

  // Callback para excluir um grupo
  bot.action(/mgd_(.+)/, async (ctx) => {
    const groupId = ctx.match[1];

    // Ler o arquivo de configuração existente
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler o arquivo de configuração:', error.message);
      return ctx.answerCbQuery('Erro ao acessar o arquivo de configuração.');
    }

    // Remover o grupo
    const groupIndex = config.groups.findIndex(group => group.id.toString() === groupId);
    if (groupIndex !== -1) {
      const removedGroup = config.groups.splice(groupIndex, 1);

      // Salvar a configuração atualizada
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

        // Atualizar os botões
        const buttons = [
          [{ text: 'Nome', callback_data: 'header' }, { text: '👀', callback_data: 'header' }, { text: '🗑', callback_data: 'header' }]
        ];
        config.groups.forEach((group) => {
          buttons.push([
            { text: group.name, callback_data: `name_${group.id}` },
            { text: group.status ? '✅' : '☑️', callback_data: `mgs_${group.id}` },
            { text: '🗑', callback_data: `mgd_${group.id}` }
          ]);
        });

        await ctx.editMessageReplyMarkup({
          inline_keyboard: buttons
        });

        return ctx.answerCbQuery(`Grupo "${removedGroup[0].name}" removido com sucesso.`);
      } catch (error) {
        console.error('Erro ao salvar o arquivo de configuração:', error.message);
        return ctx.answerCbQuery('Erro ao salvar a configuração atualizada.');
      }
    } else {
      return ctx.answerCbQuery('Grupo não encontrado.');
    }
  });
};
