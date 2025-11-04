const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config/config.json');
const initializeCronJobs = require('../../cron/cronJobs');

module.exports = (bot) => {
  bot.command('setcron', async (ctx) => {
    const message = ctx.message.text.split(' ');

    if (message.length < 2) {
      // Exibir ajuda com todas as opções de parâmetros
      const helpMessage = `
<b>📋 Como usar o comando /setcron:</b>

Defina o horário de execução para uma das tarefas automáticas. Use o formato:
<code>/setcron HH:MM:SS!!&lt;cron type&gt;</code>

<b>Tipos de cron disponíveis:</b>
- <code>fortgirls</code> - Configura o horário para análise das skins.
- <code>tryhard</code> - Configura o horário para o ranking de Try Hard.
- <code>jonesy</code> - Configura o horário para análise do Jonesy.
- <code>fortme</code> - Configura o horário para análise do FortMe.

<b>Exemplo de uso:</b>
<code>/setcron 10:30:00!!fortgirls</code>

<b>Dica:</b> Toque e copie qualquer tipo de cron acima para usar no comando. 😉
      `.trim();

      return ctx.reply(helpMessage, { parse_mode: 'HTML' });
    }

    const [time, cronType] = message[1].split('!!');
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

    if (!timeRegex.test(time) || !cronType) {
      return ctx.reply('Formato inválido! Use o formato HH:MM:SS!!<cron type>. Exemplo: /setcron 10:30:00!!fortgirls');
    }

    const [originalHour, minute, second] = time.split(':').map(Number);

    if (originalHour > 23 || minute > 59 || second > 59) {
      return ctx.reply('Erro: Certifique-se de que os valores de hora, minuto e segundo estão dentro dos limites (HH: 0-23, MM: 0-59, SS: 0-59).');
    }

    // Verifica o timezone do sistema
    const systemTimezoneOffset = new Date().getTimezoneOffset(); // Em minutos
    let adjustedHour = originalHour;

    if (systemTimezoneOffset === 0) {
      // Sistema está em UTC 0, ajusta para o horário do Brasil (UTC-3)
      adjustedHour += 3;
      if (adjustedHour >= 24) {
        adjustedHour -= 24; // Ajusta para overflow após meia-noite
      }
    }

    const cronSchedule = `${second} ${minute} ${adjustedHour} * * *`; // Formato para node-cron

    // Atualizar o arquivo de configuração
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Verificar se o tipo de cron é válido
      if (!config.cronJobs[cronType]) {
        return ctx.reply(`Erro: Tipo de cron "${cronType}" inválido. Tipos válidos: fortgirls, tryhard, jonesy, fortme.`);
      }

      // Atualizar o cron apenas se o status estiver ativo
      if (!config.cronJobs[cronType].status) {
        return ctx.reply(`O cron "${cronType}" está desativado. Ative-o antes de configurar o horário.`);
      }

      config.cronJobs[cronType].schedule = cronSchedule;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

      // Reiniciar o cron
      initializeCronJobs();

      const adminName = ctx.from.first_name || ctx.from.username || 'Desconhecido';
      const cronMessage = `⏰ O cron "<b>${cronType}</b>" foi configurado para <b>${String(originalHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}</b> (Horário de Brasília) por <b>${adminName}</b>.`;
      ctx.reply(cronMessage, { parse_mode: 'HTML' });

      // Registrar no grupo de logs
      await logAction(bot, cronMessage);
    } catch (error) {
      console.error('[ERROR] Falha ao atualizar o cron:', error.message);
      ctx.reply('Ocorreu um erro ao atualizar o cron. Verifique o formato do arquivo de configuração.');
    }
  });

  const logAction = async (bot, message) => {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const logGroup = config.logGroup;

    if (logGroup && logGroup.status && logGroup.id) {
      try {
        const options = {
          parse_mode: 'HTML'
        };

        if (logGroup.topic) {
          options.message_thread_id = logGroup.topic;
        }

        await bot.telegram.sendMessage(logGroup.id, `📢 <b>Ação registrada:</b>\n${message}`, options);
        console.log('[INFO] Ação registrada no grupo de logs.');
      } catch (error) {
        console.error('[ERROR] Falha ao registrar ação no grupo de logs:', error.message);
      }
    }
  };
};
