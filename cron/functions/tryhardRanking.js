const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

// Caminhos dos arquivos
const tryhardFilePath = path.join(__dirname, '../../database/dalytryhard.json');

// Função para enviar mídia com retry e respeito ao rate limit
async function sendMediaWithRetry(bot, chatId, mediaId, message, mediaType, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      if (mediaType === 'photo') {
        return await bot.telegram.sendPhoto(chatId, mediaId, {
          caption: message,
          parse_mode: 'HTML'
        });
      } else if (mediaType === 'animation') {
        return await bot.telegram.sendAnimation(chatId, mediaId, {
          caption: message,
          parse_mode: 'HTML'
        });
      } else if (mediaType === 'video') {
        return await bot.telegram.sendVideo(chatId, mediaId, {
          caption: message,
          parse_mode: 'HTML'
        });
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
        console.error(`[ERROR] Falha ao enviar mídia (tentativa ${attempt}/${maxRetries}):`, error.message);
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

  console.log(`[INFO] Executando ranking de tryhard para a data ${brasiliaDate}...`);

  // Verificar se o arquivo de tryhard existe
  if (!fs.existsSync(tryhardFilePath)) {
    console.log('[INFO] Arquivo dalytryhard.json não encontrado. Nenhum ranking será processado.');
    return;
  }

  const tryhardData = JSON.parse(fs.readFileSync(tryhardFilePath, 'utf8'));

  // Filtrar grupos ativos do arquivo de configuração
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

    console.log(`[INFO] Processando grupo ${groupId} (${group.name})...`);

    // Verificar se há dados para o grupo e a data atual
    if (!tryhardData[groupId] || !tryhardData[groupId][brasiliaDate]) {
      console.log(`[INFO] Nenhum dado encontrado para o grupo ${groupId} na data ${brasiliaDate}.`);
      continue;
    }

    const groupData = tryhardData[groupId][brasiliaDate];

    // Encontrar os maiores valores de tryhard e banana
    const maxTryhard = Object.entries(groupData).reduce((max, [userId, entry]) => {
      if (entry && typeof entry.tryhard === 'number') {
        return entry.tryhard > max.tryhard ? { userId, ...entry } : max;
      }
      return max;
    }, { tryhard: 0 });

    const maxBanana = Object.entries(groupData).reduce((max, [userId, entry]) => {
      if (entry && typeof entry.banana === 'number') {
        return entry.banana > max.banana ? { userId, ...entry } : max;
      }
      return max;
    }, { banana: 0 });

    console.log(`[INFO] Maior Tryhard: ${maxTryhard.nome || 'Desconhecido'} com ${maxTryhard.tryhard}%.`);
    console.log(`[INFO] Maior Banana: ${maxBanana.nome || 'Desconhecido'} com ${maxBanana.banana}%.`);

    // Construir mensagens e imagens com base no config.json
    const tryhardConfig = maxTryhard.tryhard === 100 ? config.tryhardme.tryhard.hundred : config.tryhardme.tryhard.normaly;
    const bananaConfig = maxBanana.banana === 100 ? config.tryhardme.banana.hundred : config.tryhardme.banana.normaly;

    // Pool de mensagens padrão
    const defaultTryhardCaptions = [
      `🔥 <a href="tg://user?id=${maxTryhard.userId}">${maxTryhard.nome || 'Desconhecido'}</a> foi o mais Try Hard do dia com <b>${maxTryhard.tryhard}%</b>!\n\n💪 <i>Esse é o verdadeiro rei do lobby!</i>`,
      `🌟 <a href="tg://user?id=${maxTryhard.userId}">${maxTryhard.nome || 'Desconhecido'}</a> dominou o dia com <b>${maxTryhard.tryhard}%</b> Try Hard!\n\n🏆 <i>Alguém segura esse monstro?</i>`,
      `⚡ <a href="tg://user?id=${maxTryhard.userId}">${maxTryhard.nome || 'Desconhecido'}</a> atingiu <b>${maxTryhard.tryhard}%</b> Try Hard hoje!\n\n🚀 <i>Tá impossível de parar!</i>`
    ];

    const defaultBananaCaptions = [
      `🍌 <a href="tg://user?id=${maxBanana.userId}">${maxBanana.nome || 'Desconhecido'}</a> foi o mais Embananado do dia com <b>${maxBanana.banana}%</b>!\n\n😂 <i>Alguém dá uma ajuda pra ele sair do lobby?</i>`,
      `🙃 <a href="tg://user?id=${maxBanana.userId}">${maxBanana.nome || 'Desconhecido'}</a> acumulou <b>${maxBanana.banana}%</b> Banana hoje!\n\n💭 <i>Talvez amanhã seja melhor...</i>`,
      `💥 <a href="tg://user?id=${maxBanana.userId}">${maxBanana.nome || 'Desconhecido'}</a> ficou com <b>${maxBanana.banana}%</b> Banana!\n\n🌀 <i>Tá difícil, mas não desista!</i>`
    ];

    // Combinar mensagens do config.json com o pool padrão
    const tryhardCaptions = [
      ...(tryhardConfig.messages || []),
      ...defaultTryhardCaptions
    ];

    const bananaCaptions = [
      ...(bananaConfig.messages || []),
      ...defaultBananaCaptions
    ];

    const randomTryhardCaption = tryhardCaptions[Math.floor(Math.random() * tryhardCaptions.length)];
    const randomBananaCaption = bananaCaptions[Math.floor(Math.random() * bananaCaptions.length)];

    // Enviar mídia e texto para Tryhard
    if (tryhardConfig.status) {
      try {
        await sendMediaWithRetry(bot, groupId, tryhardConfig.imageId, randomTryhardCaption, tryhardConfig.mediaType);
        console.log(`[SUCCESS] Ranking tryhard enviado para o grupo ${group.name}`);
        
        // Delay entre mensagens do mesmo grupo
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`[ERROR] Falha ao enviar tryhard para o grupo ${group.name}:`, error.message);
      }
    }

    // Enviar mídia e texto para Banana
    if (bananaConfig.status) {
      try {
        await sendMediaWithRetry(bot, groupId, bananaConfig.imageId, randomBananaCaption, bananaConfig.mediaType);
        console.log(`[SUCCESS] Ranking banana enviado para o grupo ${group.name}`);
      } catch (error) {
        console.error(`[ERROR] Falha ao enviar banana para o grupo ${group.name}:`, error.message);
      }
    }
    
    // Delay entre grupos para evitar rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('[SUCCESS] Ranking de tryhard concluído para todos os grupos.');
};
