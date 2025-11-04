const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const configPath = path.join(__dirname, '../config/config.json');
const analyzeDalyGirl = require('./functions/analyzeDalyGirl');
const tryhardRanking = require('./functions/tryhardRanking');
const analyzeJonesy = require('./functions/analyzeJonesy');
const analyzeFortMe = require('./functions/analyzeFortMe');
const x1Promotion = require('./functions/x1Promotion');

let currentTasks = {}; // Armazena as tarefas agendadas

module.exports = () => {
  // Parar todas as tarefas agendadas, se existirem
  Object.values(currentTasks).forEach(task => task.stop());
  currentTasks = {};

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const bot = new Telegraf(config.apiKey);

  // Verificar e criar tópico no grupo de logs, se necessário
  if (config.logGroup.status && config.logGroup.topic === null) {
    bot.telegram.createForumTopic(config.logGroup.id, 'Fortme')
      .then((topic) => {
        config.logGroup.topic = topic.message_thread_id;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        console.log('Tópico "Fortme" criado no grupo de logs.');
      })
      .catch((error) => {
        console.error('Erro ao criar o tópico no grupo de logs:', error);
      });
  }

  // Agendar tarefas com base no arquivo de configuração
  Object.entries(config.cronJobs).forEach(([cronType, cronConfig]) => {
    if (cronConfig.status) {
      const cronSchedule = cronConfig.schedule;

      // Validar o formato do cronSchedule
      const cronRegex = /^(\d{1,2}) (\d{1,2}) (\d{1,2}) \* \* \*$/;
      if (!cronRegex.test(cronSchedule)) {
        console.error(`Formato inválido para cronSchedule do tipo "${cronType}" no arquivo de configuração.`);
        return;
      }

      // Agendar a tarefa
      currentTasks[cronType] = cron.schedule(cronSchedule, async () => {
        console.log(`[INFO] Executando cron "${cronType}" no horário configurado: ${cronSchedule}`);

        try {
          if (cronType === 'fortgirls') {
            console.log('[INFO] Executando análise do Fortgirl...');
            await analyzeDalyGirl(bot);
          } else if (cronType === 'tryhard') {
            console.log('[INFO] Executando ranking de Tryhard...');
            await tryhardRanking(bot);
          } else if (cronType === 'jonesy') {
            console.log('[INFO] Executando análise do Jonesy...');
            await analyzeJonesy(bot);
          } else if (cronType === 'fortme') {
            console.log('[INFO] Executando análise do FortMe...');
            await analyzeFortMe(bot);
          } else if (cronType === 'x1promotion') {
            console.log('[INFO] Executando promoção de X1...');
            await x1Promotion(bot);
          } else {
            console.log(`[INFO] Nenhuma ação definida para o cron "${cronType}".`);
          }

          // Registrar log de sucesso
          if (config.logGroup.status) {
            const logMessage = `✅ Cron "${cronType}" executado com sucesso às ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`;
            bot.telegram.sendMessage(config.logGroup.id, logMessage, {
              message_thread_id: config.logGroup.topic || undefined
            }).catch((error) => {
              console.error(`Erro ao enviar log para o grupo de logs (${cronType}):`, error.message);
            });
          }
        } catch (error) {
          console.error(`[ERROR] Falha ao executar cron "${cronType}":`, error.message);

          // Registrar log de erro
          if (config.logGroup.status) {
            bot.telegram.sendMessage(config.logGroup.id, `❌ Erro ao executar cron "${cronType}": ${error.message}`, {
              message_thread_id: config.logGroup.topic || undefined
            }).catch((err) => {
              console.error(`Erro ao enviar log de erro para o grupo de logs (${cronType}):`, err.message);
            });
          }
        }
      });

      console.log(`Cron "${cronType}" agendado com sucesso!`);
    } else {
      console.log(`Cron "${cronType}" está desativado e não será agendado.`);
    }
  });
};
