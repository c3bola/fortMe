const { query } = require('../../database/dbConnection');

module.exports = (bot) => {
  bot.command('config', async (ctx) => {
    try {
      // Buscar features (comandos) do banco
      const features = await query(
        'SELECT id_fortme_features, code, description, is_active FROM tb_fortme_features ORDER BY code ASC'
      );

      if (features.length === 0) {
        return ctx.reply('Nenhum comando registrado no sistema.');
      }

      // Criar botões para os comandos
      const buttons = features.map((feature) => [
        { text: feature.code, callback_data: `cmd_info_${feature.id_fortme_features}` },
        { text: feature.is_active ? '✅' : '☑️', callback_data: `cmdt_${feature.id_fortme_features}` }
      ]);

      console.log('[DEBUG] Exibindo configurações de features:', features.length);

      // Enviar mensagem com os botões
      await ctx.reply('⚙️ Configurações do Bot:\n\nClique no comando para ver detalhes ou no ícone para ativar/desativar.', {
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    } catch (error) {
      console.error('[ERROR] Erro no comando /config:', error.message);
      return ctx.reply('❌ Erro ao acessar as configurações do banco de dados.');
    }
  });

  // Callback para alternar o status dos comandos
  bot.action(/cmdt_(\d+)/, async (ctx) => {
    try {
      const featureId = parseInt(ctx.match[1], 10);

      // Buscar a feature atual
      const features = await query(
        'SELECT id_fortme_features, code, is_active FROM tb_fortme_features WHERE id_fortme_features = ?',
        [featureId]
      );

      if (features.length === 0) {
        return ctx.answerCbQuery('Comando não encontrado.', { show_alert: true });
      }

      const feature = features[0];
      const newStatus = feature.is_active === 1 ? 0 : 1;

      // Atualizar o status
      await query(
        'UPDATE tb_fortme_features SET is_active = ? WHERE id_fortme_features = ?',
        [newStatus, featureId]
      );

      console.log('[INFO] Status do comando alterado:', { 
        code: feature.code, 
        newStatus: newStatus === 1 ? 'Ativo' : 'Inativo' 
      });

      // Buscar todas as features atualizadas
      const allFeatures = await query(
        'SELECT id_fortme_features, code, description, is_active FROM tb_fortme_features ORDER BY code ASC'
      );

      // Atualizar os botões
      const buttons = allFeatures.map((f) => [
        { text: f.code, callback_data: `cmd_info_${f.id_fortme_features}` },
        { text: f.is_active ? '✅' : '☑️', callback_data: `cmdt_${f.id_fortme_features}` }
      ]);

      await ctx.editMessageReplyMarkup({
        inline_keyboard: buttons
      });

      return ctx.answerCbQuery(
        `O comando "${feature.code}" foi ${newStatus === 1 ? 'ativado ✅' : 'desativado ❌'}.`
      );

    } catch (error) {
      console.error('[ERROR] Erro ao alternar status do comando:', error.message);
      return ctx.answerCbQuery('Erro ao salvar a configuração.', { show_alert: true });
    }
  });

  // Callback para exibir informações sobre o comando
  bot.action(/cmd_info_(\d+)/, async (ctx) => {
    try {
      const featureId = parseInt(ctx.match[1], 10);

      const features = await query(
        'SELECT code, description FROM tb_fortme_features WHERE id_fortme_features = ?',
        [featureId]
      );

      if (features.length === 0) {
        return ctx.answerCbQuery('Comando não encontrado.', { show_alert: true });
      }

      const feature = features[0];
      const info = feature.description || 'Sem descrição disponível';

      return ctx.answerCbQuery(`📋 ${feature.code}: ${info}`, { show_alert: true });
    } catch (error) {
      console.error('[ERROR] Erro ao buscar informações do comando:', error.message);
      return ctx.answerCbQuery('Erro ao buscar informações.', { show_alert: true });
    }
  });
};
