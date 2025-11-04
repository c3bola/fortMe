const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

const dalygirlFilePath = path.join(__dirname, '../../database/dalygirl.json');
const fortgirlFilePath = path.join(__dirname, '../../database/fortgirl.json');
const phrasesFilePath = path.join(__dirname, '../../config/phrases.json');

module.exports = async (bot) => {
  const now = new Date();
  const brasiliaDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000 - 3 * 3600000).toISOString().split('T')[0]; // Data no formato YYYY-MM-DD

  if (!fs.existsSync(dalygirlFilePath)) {
    console.log('Arquivo dalygirl.json não encontrado.');
    return;
  }

  if (!fs.existsSync(fortgirlFilePath)) {
    console.log('Arquivo fortgirl.json não encontrado.');
    return;
  }

  if (!fs.existsSync(phrasesFilePath)) {
    console.log('Arquivo phrases.json não encontrado.');
    return;
  }

  const dalygirlData = JSON.parse(fs.readFileSync(dalygirlFilePath, 'utf8'));
  const fortgirlData = JSON.parse(fs.readFileSync(fortgirlFilePath, 'utf8'));
  const phrases = JSON.parse(fs.readFileSync(phrasesFilePath, 'utf8')).analyzeDalyGirl;

  // Criar um mapa de IDs para nomes de skins
  const skinMap = fortgirlData.reduce((map, skin) => {
    map[skin.imageId] = skin.name;
    return map;
  }, {});

  // Filtrar grupos registrados e ativos
  const activeGroups = config.groups.filter(group => group.status);

  for (const group of activeGroups) {
    const groupId = group.id.toString();

    // Verificar se há dados para o grupo e a data atual
    if (!dalygirlData[groupId] || !dalygirlData[groupId][brasiliaDate]) continue;

    const groupData = dalygirlData[groupId][brasiliaDate];

    let mostLoved = null;
    let mostHated = null;

    // Encontrar a skin mais amada e a mais odiada
    for (const userId in groupData) {
      const entry = groupData[userId];
      if (!mostLoved || entry.rating.heart > mostLoved.rating.heart) {
        mostLoved = entry;
      }
      if (!mostHated || entry.rating.hat > mostHated.rating.hat) {
        mostHated = entry;
      }
    }

    // Verificar se houve avaliações
    if (mostLoved && mostLoved.rating.heart === 0 && mostHated && mostHated.rating.hat === 0) {
      const noRatingsMessages = [
        '📊 Hoje ninguém deu aquele hype nas skins! Bora avaliar amanhã? 😔',
        '😢 Nenhuma avaliação hoje! As skins estão esperando seu feedback amanhã! 🌟',
        '🛑 Sem avaliações hoje! Não deixe as skins no vácuo, amanhã tem mais! 🚀'
      ];
      const randomMessage = noRatingsMessages[Math.floor(Math.random() * noRatingsMessages.length)];
      await bot.telegram.sendMessage(groupId, randomMessage, { parse_mode: 'HTML' });
    } else {
      if (mostLoved) {
        const skinName = skinMap[mostLoved.imageId] || 'Skin Desconhecida';
        const mentionLoved = `<a href="tg://user?id=${mostLoved.userId}">${mostLoved.nome}</a>`;
        const randomLovedCaption = phrases.mostLoved[Math.floor(Math.random() * phrases.mostLoved.length)]
          .replace('{mention}', mentionLoved)
          .replace('{skinname}', skinName)
          .replace('{vote}', mostLoved.rating.heart);
        await bot.telegram.sendPhoto(groupId, mostLoved.imageId, {
          caption: randomLovedCaption,
          parse_mode: 'HTML'
        });
      }

      if (mostHated) {
        const skinName = skinMap[mostHated.imageId] || 'Skin Desconhecida';
        const mentionHated = `<a href="tg://user?id=${mostHated.userId}">${mostHated.nome}</a>`;
        const randomHatedCaption = phrases.mostHated[Math.floor(Math.random() * phrases.mostHated.length)]
          .replace('{mention}', mentionHated)
          .replace('{skinname}', skinName)
          .replace('{vote}', mostHated.rating.hat);
        await bot.telegram.sendPhoto(groupId, mostHated.imageId, {
          caption: randomHatedCaption,
          parse_mode: 'HTML'
        });
      }
    }
  }
};
