const config = require('../../config/config');
const { query } = require('../../database/dbConnection');
const { checkAdminPermission } = require('./addAdmin');

module.exports = (bot) => {
  bot.command('sendrank', async (ctx) => {
    console.log('[INFO] Comando /sendrank recebido');
    console.log(`[DEBUG] User: ${ctx.from.id} (${ctx.from.first_name || ctx.from.username})`);
    console.log(`[DEBUG] Chat type: ${ctx.chat.type}`);
    
    // Verificar se é admin (perfil 4 ou 5)
    const permission = await checkAdminPermission(ctx.from.id);
    console.log(`[DEBUG] É admin: ${permission.isAdmin}`);
    
    if (!permission.isAdmin) {
      console.log('[WARNING] Usuário não autorizado tentou usar /sendrank');
      return ctx.reply('❌ Você não tem permissão para usar este comando.');
    }

    // Verificar se está em chat privado
    if (ctx.chat.type !== 'private') {
      console.log('[WARNING] Tentativa de usar /sendrank fora do privado');
      return ctx.reply('⚠️ Este comando só pode ser usado no privado do bot.');
    }

    const args = ctx.message.text.split(' ');
    const rankType = args[1]?.toLowerCase();
    console.log(`[DEBUG] Tipo de rank solicitado: ${rankType || 'nenhum (help)'}`);

    // Se não passou nenhum argumento, mostrar o help
    if (!rankType) {
      const helpMessage = `
📊 <b>Comando /sendrank</b>

<b>Uso:</b> <code>/sendrank &lt;tipo&gt;</code>

<b>Tipos de rank disponíveis:</b>

🔥 <code>tryhard</code> - Ranking de Tryhard/Banana
  • Mostra o maior tryhard e maior embananado do dia

🌸 <code>fortgirl</code> - Ranking das FortGirls
  • Mostra a skin mais amada e mais odiada do dia

👤 <code>jonesyme</code> - Ranking do Jonesy
  • Mostra o jonesy mais amado e mais odiado do dia

🎮 <code>fortme</code> - Ranking do FortMe
  • Mostra o fortme mais amado e mais odiado do dia

⚔️ <code>x1</code> - Ranking de X1
  • Mostra o top 5 de vitórias em duelos do dia

<b>Exemplo:</b>
<code>/sendrank tryhard</code>
<code>/sendrank fortgirl</code>
<code>/sendrank x1</code>
      `.trim();
      
      return ctx.reply(helpMessage, { parse_mode: 'HTML' });
    }

    // Executar a função correspondente ao tipo de rank
    try {
      let statusMessage = null;

      switch (rankType) {
        case 'tryhard':
          statusMessage = await ctx.reply('🔥 Analisando ranking de Tryhard/Banana...');
          await sendTryhardRanking(bot);
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Ranking de Tryhard/Banana enviado com sucesso!'
          );
          break;

        case 'fortgirl':
        case 'fortgirls':
          statusMessage = await ctx.reply('🌸 Analisando ranking das FortGirls...');
          await sendLoveHateRanking(bot, 2, 'FortGirl');
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Ranking das FortGirls enviado com sucesso!'
          );
          break;

        case 'jonesyme':
        case 'jonesy':
          statusMessage = await ctx.reply('👤 Analisando ranking do Jonesy...');
          await sendLoveHateRanking(bot, 3, 'Jonesy');
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Ranking do Jonesy enviado com sucesso!'
          );
          break;

        case 'fortme':
          statusMessage = await ctx.reply('🎮 Analisando ranking do FortMe...');
          await sendLoveHateRanking(bot, 1, 'FortMe');
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Ranking do FortMe enviado com sucesso!'
          );
          break;

        case 'x1':
          console.log('[INFO] Iniciando envio de ranking X1...');
          statusMessage = await ctx.reply('⚔️ Analisando ranking de X1...');
          await sendX1Ranking(bot);
          console.log('[SUCCESS] Ranking X1 enviado');
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            null,
            '✅ Ranking de X1 enviado com sucesso!'
          );
          break;

        default:
          console.log(`[WARNING] Tipo de rank inválido: ${rankType}`);
          return ctx.reply(`❌ Tipo de rank inválido: <code>${rankType}</code>\n\nUse <code>/sendrank</code> sem argumentos para ver os tipos disponíveis.`, { parse_mode: 'HTML' });
      }

      // Log da execução para o grupo de logs
      if (config.logGroup?.status && config.logGroup?.id) {
        const logMessage = `📊 <b>Comando /sendrank executado</b>\n\n👤 <b>Admin:</b> ${ctx.from.first_name || ctx.from.username}\n📝 <b>Tipo:</b> ${rankType}\n⏰ <b>Horário:</b> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
        
        bot.telegram.sendMessage(config.logGroup.id, logMessage, {
          parse_mode: 'HTML',
          message_thread_id: config.logGroup.topic || undefined
        }).catch((error) => {
          console.error('[ERROR] Falha ao enviar log:', error.message);
        });
      }

    } catch (error) {
      console.error('[ERROR] Erro ao executar sendrank:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      
      await ctx.reply(`❌ Erro ao enviar o ranking: ${error.message}`, { parse_mode: 'HTML' });
      
      // Log de erro para o grupo de logs
      if (config.logGroup?.status && config.logGroup?.id) {
        const errorLogMessage = `❌ <b>Erro no comando /sendrank</b>\n\n👤 <b>Admin:</b> ${ctx.from.first_name || ctx.from.username}\n📝 <b>Tipo:</b> ${rankType}\n⚠️ <b>Erro:</b> ${error.message}`;
        
        bot.telegram.sendMessage(config.logGroup.id, errorLogMessage, {
          parse_mode: 'HTML',
          message_thread_id: config.logGroup.topic || undefined
        }).catch((err) => {
          console.error('[ERROR] Falha ao enviar log de erro:', err.message);
        });
      }
    }
  });
};

/**
 * Envia ranking de Tryhard/Banana para todos os grupos ativos
 */
async function sendTryhardRanking(bot) {
  try {
    const today = new Date().toISOString().split('T')[0]; // UTC-0
    
    // Buscar grupos ativos
    const groups = await query(
      'SELECT group_id, group_name FROM tb_bot_groups WHERE status = 1'
    );

    for (const group of groups) {
      try {
        // Buscar maior tryhard do dia
        const tryhardResult = await query(
          `SELECT u.percentage_value, u.fk_id_user, d.value as username
           FROM tb_fortme_daily_usage u
           JOIN tb_data_user d ON u.fk_id_user = d.fk_id_user AND d.fk_id_metadata = 1
           WHERE u.fk_group_id = ? AND u.fk_id_features = 4 AND u.used_date = ?
           ORDER BY u.percentage_value DESC
           LIMIT 1`,
          [group.group_id, today]
        );

        // Buscar maior banana do dia (menor porcentagem)
        const bananaResult = await query(
          `SELECT u.percentage_value, u.fk_id_user, d.value as username
           FROM tb_fortme_daily_usage u
           JOIN tb_data_user d ON u.fk_id_user = d.fk_id_user AND d.fk_id_metadata = 1
           WHERE u.fk_group_id = ? AND u.fk_id_features = 4 AND u.used_date = ?
           ORDER BY u.percentage_value ASC
           LIMIT 1`,
          [group.group_id, today]
        );

        // Enviar tryhard
        if (tryhardResult.length > 0) {
          const tryhard = tryhardResult[0];
          const tryhardValue = parseFloat(tryhard.percentage_value);
          const configKey = tryhardValue === 100 ? 'hundred' : 'normaly';
          const tryhardConfig = config.tryhardme.tryhard[configKey];
          
          if (tryhardConfig.status) {
            const text = tryhardConfig.text
              .replace('{username}', tryhard.username || 'Usuário')
              .replace('{value}', tryhardValue);
            
            if (tryhardConfig.mediaType === 'animation') {
              await bot.telegram.sendAnimation(group.group_id, tryhardConfig.imageId, { caption: text });
            } else {
              await bot.telegram.sendPhoto(group.group_id, tryhardConfig.imageId, { caption: text });
            }
          }
        }

        // Enviar banana
        if (bananaResult.length > 0) {
          const banana = bananaResult[0];
          const bananaValue = 100 - parseFloat(banana.percentage_value);
          const configKey = bananaValue === 100 ? 'hundred' : 'normaly';
          const bananaConfig = config.tryhardme.banana[configKey];
          
          if (bananaConfig.status) {
            const text = bananaConfig.text
              .replace('{username}', banana.username || 'Usuário')
              .replace('{value}', bananaValue);
            
            if (bananaConfig.mediaType === 'animation') {
              await bot.telegram.sendAnimation(group.group_id, bananaConfig.imageId, { caption: text });
            } else {
              await bot.telegram.sendPhoto(group.group_id, bananaConfig.imageId, { caption: text });
            }
          }
        }

        // Delay entre grupos
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[ERROR] Erro ao enviar tryhard ranking para grupo ${group.group_id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[ERROR] Erro ao processar tryhard ranking:', error.message);
    throw error;
  }
}

/**
 * Envia ranking de Love/Hate para todos os grupos ativos
 */
async function sendLoveHateRanking(bot, featureId, featureName) {
  try {
    const today = new Date().toISOString().split('T')[0]; // UTC-0
    
    // Buscar grupos ativos
    const groups = await query(
      'SELECT group_id, group_name FROM tb_bot_groups WHERE status = 1'
    );

    for (const group of groups) {
      try {
        // Buscar skin com mais likes
        const mostLoved = await query(
          `SELECT c.name, c.image_id, COUNT(v.vote) as total_votes
           FROM tb_fortme_daily_usage u
           JOIN tb_fortme_contents c ON u.fk_id_contents = c.id_fortme_contents
           LEFT JOIN tb_fortme_votes v ON u.id_fortme_daily_usage = v.fk_daily_usage_id AND v.vote = 'heart'
           WHERE u.fk_group_id = ? AND u.fk_id_features = ? AND u.used_date = ?
           GROUP BY c.id_fortme_contents, c.name, c.image_id
           ORDER BY total_votes DESC
           LIMIT 1`,
          [group.group_id, featureId, today]
        );

        // Buscar skin com mais hates
        const mostHated = await query(
          `SELECT c.name, c.image_id, COUNT(v.vote) as total_votes
           FROM tb_fortme_daily_usage u
           JOIN tb_fortme_contents c ON u.fk_id_contents = c.id_fortme_contents
           LEFT JOIN tb_fortme_votes v ON u.id_fortme_daily_usage = v.fk_daily_usage_id AND v.vote = 'hat'
           WHERE u.fk_group_id = ? AND u.fk_id_features = ? AND u.used_date = ?
           GROUP BY c.id_fortme_contents, c.name, c.image_id
           ORDER BY total_votes DESC
           LIMIT 1`,
          [group.group_id, featureId, today]
        );

        // Enviar skin mais amada
        if (mostLoved.length > 0 && mostLoved[0].total_votes > 0) {
          const loved = mostLoved[0];
          await bot.telegram.sendPhoto(
            group.group_id,
            loved.image_id,
            { caption: `❤️ <b>${featureName} mais amada do dia:</b>\n${loved.name} (${loved.total_votes} curtidas)`, parse_mode: 'HTML' }
          );
        }

        // Enviar skin mais odiada
        if (mostHated.length > 0 && mostHated[0].total_votes > 0) {
          const hated = mostHated[0];
          await bot.telegram.sendPhoto(
            group.group_id,
            hated.image_id,
            { caption: `🎩 <b>${featureName} mais odiada do dia:</b>\n${hated.name} (${hated.total_votes} votos)`, parse_mode: 'HTML' }
          );
        }

        // Delay entre grupos
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[ERROR] Erro ao enviar ${featureName} ranking para grupo ${group.group_id}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`[ERROR] Erro ao processar ${featureName} ranking:`, error.message);
    throw error;
  }
}

/**
 * Envia ranking de X1 para todos os grupos ativos
 */
async function sendX1Ranking(bot) {
  try {
    const today = new Date().toISOString().split('T')[0]; // UTC-0
    
    // Buscar grupos ativos
    const groups = await query(
      'SELECT group_id, group_name FROM tb_bot_groups WHERE status = 1'
    );

    for (const group of groups) {
      try {
        // Buscar top 5 vencedores do dia
        const ranking = await query(
          `SELECT duels.winner_id, d.value as username, COUNT(*) as wins
           FROM tb_fortme_duels duels
           LEFT JOIN tb_data_user d ON duels.winner_id = d.fk_id_user AND d.fk_id_metadata = 1
           WHERE duels.fk_group_id = ? 
             AND duels.status = 'completed' 
             AND DATE(duels.created_at) = ?
             AND duels.winner_id IS NOT NULL
           GROUP BY duels.winner_id, d.value
           ORDER BY wins DESC
           LIMIT 5`,
          [group.group_id, today]
        );

        if (ranking.length > 0) {
          let text = '⚔️ <b>TOP 5 X1 DO DIA</b> ⚔️\n\n';
          
          const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
          ranking.forEach((player, index) => {
            const medal = medals[index] || '🏅';
            const name = player.username || 'Usuário';
            text += `${medal} ${name} - ${player.wins} vitória${player.wins > 1 ? 's' : ''}\n`;
          });

          await bot.telegram.sendMessage(group.group_id, text, { parse_mode: 'HTML' });
        }

        // Delay entre grupos
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[ERROR] Erro ao enviar X1 ranking para grupo ${group.group_id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[ERROR] Erro ao processar X1 ranking:', error.message);
    throw error;
  }
}
