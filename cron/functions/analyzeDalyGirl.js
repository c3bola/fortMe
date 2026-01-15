const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

const dalygirlFilePath = path.join(__dirname, '../../database/dalygirl.json');
const fortgirlFilePath = path.join(__dirname, '../../database/fortgirl.json');
const phrasesFilePath = path.join(__dirname, '../../config/phrases.json');

// Função para enviar mensagem com retry e respeito ao rate limit
async function sendMessageWithRetry(bot, chatId, content, options = {}, isPhoto = false, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      if (isPhoto) {
        return await bot.telegram.sendPhoto(chatId, content, options);
      } else {
        return await bot.telegram.sendMessage(chatId, content, options);
      }
    } catch (error) {
      attempt++;
      
      // Verificar se é erro de rate limit
      if (error.response && error.response.parameters && error.response.parameters.retry_after) {
        const retryAfter = error.response.parameters.retry_after;
        console.log(`[WARNING] Rate limit atingido. Aguardando ${retryAfter} segundos antes de retentar...`);
        await new Promise(resolve => setTimeout(resolve, (retryAfter + 1) * 1000));
      } else if (attempt < maxRetries) {
        // Erro genérico, aguardar 2 segundos
        console.error(`[ERROR] Falha ao enviar mensagem (tentativa ${attempt}/${maxRetries}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }
}

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
  // Carregar grupos do broadcast.json
  const broadcastPath = path.join(__dirname, '../../database/broadcast.json');
  let activeGroups = [];
  if (fs.existsSync(broadcastPath)) {
    const broadcastData = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
    if (broadcastData.groups) {
      activeGroups = Object.values(broadcastData.groups).map(g => ({
        id: typeof g.id === 'string' ? parseInt(g.id, 10) : g.id,
        name: g.name,
        status: true
      }));
    }
  }

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
      await sendMessageWithRetry(bot, groupId, randomMessage, { parse_mode: 'HTML' });
      console.log(`[SUCCESS] Mensagem de sem avaliações enviada para grupo ${group.name}`);
    } else {
      if (mostLoved) {
        const skinName = skinMap[mostLoved.imageId] || 'Skin Desconhecida';
        const mentionLoved = `<a href="tg://user?id=${mostLoved.userId}">${mostLoved.nome}</a>`;
        const randomLovedCaption = phrases.mostLoved[Math.floor(Math.random() * phrases.mostLoved.length)]
          .replace('{mention}', mentionLoved)
          .replace('{skinname}', skinName)
          .replace('{vote}', mostLoved.rating.heart);
        await sendMessageWithRetry(bot, groupId, mostLoved.imageId, {
          caption: randomLovedCaption,
          parse_mode: 'HTML'
        }, true);
        console.log(`[SUCCESS] Skin mais amada enviada para grupo ${group.name}`);
        
        // Delay entre mensagens do mesmo grupo
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      if (mostHated) {
        const skinName = skinMap[mostHated.imageId] || 'Skin Desconhecida';
        const mentionHated = `<a href="tg://user?id=${mostHated.userId}">${mostHated.nome}</a>`;
        const randomHatedCaption = phrases.mostHated[Math.floor(Math.random() * phrases.mostHated.length)]
          .replace('{mention}', mentionHated)
          .replace('{skinname}', skinName)
          .replace('{vote}', mostHated.rating.hat);
        await sendMessageWithRetry(bot, groupId, mostHated.imageId, {
          caption: randomHatedCaption,
          parse_mode: 'HTML'
        }, true);
        console.log(`[SUCCESS] Skin mais odiada enviada para grupo ${group.name}`);
      }
    }
    
    // Delay entre grupos para evitar rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('[SUCCESS] Análise de fortgirl concluída para todos os grupos.');
};
