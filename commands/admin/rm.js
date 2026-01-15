const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

const files = {
  jonesy: path.join(__dirname, '../../database/fortjonesy.json'),
  girls: path.join(__dirname, '../../database/fortgirl.json'),
  fortme: path.join(__dirname, '../../database/fortme.json'),
};

module.exports = (bot) => {
  bot.command('rm', async (ctx) => {
    // Apenas administradores
    if (!config.admins.some(admin => admin.id === ctx.from.id)) {
      return ctx.reply('Apenas administradores podem usar este comando.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    const param = args[0]?.toLowerCase();
    const id = parseInt(args[1], 10);
    if (!param || !['jonesy', 'girls', 'fortme'].includes(param) || isNaN(id)) {
      return ctx.reply('Uso: /rm jonesy|girls|fortme id');
    }

    const filePath = files[param];
    if (!fs.existsSync(filePath)) {
      return ctx.reply('Arquivo de dados não encontrado.');
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return ctx.reply('Erro ao ler o arquivo de dados.');
    }

    if (!Array.isArray(data) || data.length === 0) {
      return ctx.reply('Nenhum item encontrado.');
    }

    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return ctx.reply('ID não encontrado.');
    }

    const removed = data.splice(index, 1)[0];
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      return ctx.reply('Erro ao salvar o arquivo de dados.');
    }

    ctx.reply(`Item removido com sucesso: ${removed.id} - ${removed.name || removed.text || 'Sem nome'}`);
  });
};
