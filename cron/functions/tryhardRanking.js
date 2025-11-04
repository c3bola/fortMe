const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

// Caminhos dos arquivos
const tryhardFilePath = path.join(__dirname, '../../database/dalytryhard.json');

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
  const activeGroups = config.groups.filter(group => group.status);

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

    // Função para enviar mídia com base no tipo
    const sendMedia = async (groupId, mediaId, message, mediaType) => {
      try {
        if (mediaType === 'photo') {
          await bot.telegram.sendPhoto(groupId, mediaId, {
            caption: message,
            parse_mode: 'HTML'
          });
        } else if (mediaType === 'animation') {
          await bot.telegram.sendAnimation(groupId, mediaId, {
            caption: message,
            parse_mode: 'HTML'
          });
        } else if (mediaType === 'video') {
          await bot.telegram.sendVideo(groupId, mediaId, {
            caption: message,
            parse_mode: 'HTML'
          });
        }
        console.log(`[INFO] Mensagem enviada com sucesso para o grupo ${groupId}.`);
      } catch (error) {
        console.error(`[ERROR] Falha ao enviar mídia para o grupo ${groupId}:`, error.message);
      }
    };

    // Enviar mídia e texto para Tryhard
    if (tryhardConfig.status) {
      await sendMedia(groupId, tryhardConfig.imageId, randomTryhardCaption, tryhardConfig.mediaType);
    }

    // Enviar mídia e texto para Banana
    if (bananaConfig.status) {
      await sendMedia(groupId, bananaConfig.imageId, randomBananaCaption, bananaConfig.mediaType);
    }
  }
};
