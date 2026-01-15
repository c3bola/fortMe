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

  // Carregar grupos do broadcast.json
  console.log('[INFO] Carregando grupos do broadcast.json para cron jobs...');
  const broadcastPath = path.join(__dirname, '../database/broadcast.json');
  let broadcastGroups = [];
  if (fs.existsSync(broadcastPath)) {
    const broadcastData = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
    if (broadcastData.groups) {
      broadcastGroups = Object.values(broadcastData.groups).map(g => ({
        id: typeof g.id === 'string' ? parseInt(g.id, 10) : g.id,
        name: g.name,
        status: true // Considera todos do broadcast como ativos
      }));
      console.log(`[SUCCESS] ${broadcastGroups.length} grupos carregados do broadcast.json`);
      broadcastGroups.forEach(g => {
        console.log(`[INFO]   - ${g.name} (ID: ${g.id})`);
      });
    } else {
      console.log('[WARNING] Nenhum grupo encontrado no broadcast.json');
    }
  } else {
    console.log('[WARNING] Arquivo broadcast.json não encontrado!');
  }

  // Substituir config.groups pelos grupos do broadcast
  config.groups = broadcastGroups;

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
      let cronSchedule = cronConfig.schedule;

      // Normalizar formato de cron: remover segundos se existir (6 campos -> 5 campos)
      const parts = cronSchedule.trim().split(/\s+/);
      if (parts.length === 6) {
        // Remover o primeiro campo (segundos) e manter os 5 restantes
        cronSchedule = parts.slice(1).join(' ');
        console.log(`[INFO] Cron "${cronType}" normalizado de 6 para 5 campos: ${cronSchedule}`);
      }

      // Validar o formato do cronSchedule (5 campos)
      if (!cron.validate(cronSchedule)) {
        console.error(`[ERROR] Formato inválido para cronSchedule do tipo "${cronType}": ${cronSchedule}`);
        return;
      }

      // Agendar a tarefa
      currentTasks[cronType] = cron.schedule(cronSchedule, async () => {
        const now = new Date();
        const brasiliaTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000 - 3 * 3600000);
        console.log(`[INFO] ========================================`);
        console.log(`[INFO] Executando cron "${cronType}"`);
        console.log(`[INFO] Horário configurado: ${cronSchedule}`);
        console.log(`[INFO] Horário atual (Brasília): ${brasiliaTime.toLocaleString('pt-BR')}`);
        console.log(`[INFO] ========================================`);

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

      console.log(`[SUCCESS] Cron "${cronType}" agendado com sucesso para: ${cronSchedule}`);
      console.log(`[INFO] Próxima execução será conforme o horário: ${cronSchedule}`);
    } else {
      console.log(`[INFO] Cron "${cronType}" está desativado no config.json e não será agendado.`);
    }
  });
  
  console.log('[INFO] ========================================');
  console.log('[SUCCESS] Sistema de cron jobs inicializado!');
  console.log(`[INFO] Total de crons ativos: ${Object.keys(currentTasks).length}`);
  console.log('[INFO] ========================================');
};
