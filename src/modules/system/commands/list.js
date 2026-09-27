const { query } = require('../../database/dbConnection');
const config = require('../../config/config');
const { checkAdminPermission } = require('./addAdmin');

module.exports = (bot) => {
  bot.command('list', async (ctx) => {
    console.log('[LIST] Comando /list recebido');
    
    // Apenas administradores (perfil 4 ou 5)
    const permission = await checkAdminPermission(ctx.from.id);
    if (!permission.isAdmin) {
      return ctx.reply('Apenas administradores podem usar este comando.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    const param = args[0]?.toLowerCase();
    
    if (!param) {
      return ctx.reply('Uso: /list admin|group|config|me|girls|jonesy|tryhard');
    }

    try {
      // Lista de admins (do config.json ainda)
      if (param === 'admin') {
        const admins = config.admins || [];
        if (admins.length === 0) {
          return ctx.reply('Nenhum administrador registrado.');
        }
        
        let text = '<b>👑 Administradores:</b>\n\n';
        const buttons = [];
        
        admins.forEach((admin, i) => {
          text += `${i + 1} - ${admin.name} (ID: <code>${admin.id}</code>)\n`;
          
          if (admin.id !== ctx.from.id) {
            buttons.push([
              { text: `Remover ${admin.name}`, callback_data: `remove_admin_${admin.id}` }
            ]);
          } else {
            buttons.push([
              { text: `Você (${admin.name})`, callback_data: 'noop' }
            ]);
          }
        });
        
        return ctx.reply(text, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: buttons
          }
        });
      }

      // Lista de grupos (do banco tb_bot_groups)
      if (param === 'group') {
        const groups = await query(
          'SELECT group_id, group_name, status, created_at FROM tb_bot_groups ORDER BY group_name ASC'
        );
        
        if (groups.length === 0) {
          return ctx.reply('Nenhum grupo registrado.');
        }
        
        let text = '<b>🏠 Grupos Registrados:</b>\n\n';
        groups.forEach((group, i) => {
          const statusIcon = group.status === 1 ? '✅' : '❌';
          text += `${i + 1} - ${group.group_name} ${statusIcon}\n`;
          text += `   ID: <code>${group.group_id}</code>\n`;
        });
        
        return ctx.reply(text, { parse_mode: 'HTML', disable_web_page_preview: true });
      }

      // Configurações gerais
      if (param === 'config') {
        let text = '<b>📋 Configurações Atuais:</b>\n\n';
        
        // Admins (ainda do config.json)
        text += '<b>👑 Administradores:</b>\n';
        const admins = config.admins || [];
        if (admins.length > 0) {
          admins.forEach(admin => {
            text += `- ${admin.name} (ID: ${admin.id})\n`;
          });
        } else {
          text += '- Nenhum registrado\n';
        }
        
        // Log Group (config.json)
        text += '\n<b>📢 Grupo de Logs:</b>\n';
        if (config.logGroup) {
          text += `- Nome: ${config.logGroup.name || '-'}\n`;
          text += `- Status: ${config.logGroup.status ? 'Ativo ✅' : 'Inativo ❌'}\n`;
          text += `- ID: ${config.logGroup.id || '-'}\n`;
          text += `- Tópico: ${config.logGroup.topic || '-'}\n`;
        } else {
          text += '- Não configurado\n';
        }
        
        // Grupos (do banco)
        text += '\n<b>🏠 Grupos Registrados:</b>\n';
        const groups = await query(
          'SELECT group_id, group_name FROM tb_bot_groups WHERE status = 1'
        );
        if (groups.length > 0) {
          groups.forEach(g => {
            text += `- ${g.group_name} (ID: ${g.group_id})\n`;
          });
        } else {
          text += '- Nenhum grupo registrado\n';
        }
        
        // Comandos ativos (do banco tb_fortme_features)
        text += '\n<b>⚙️ Comandos Ativos:</b>\n';
        const features = await query(
          'SELECT code, is_active FROM tb_fortme_features ORDER BY code ASC'
        );
        if (features.length > 0) {
          features.forEach(f => {
            text += `- ${f.code}: ${f.is_active ? 'Ativo ✅' : 'Inativo ❌'}\n`;
          });
        } else {
          text += '- Nenhum comando registrado\n';
        }
        
        return ctx.reply(text.trim(), { parse_mode: 'HTML' });
      }

      // Lista de conteúdos (me, girls, jonesy, tryhard)
      const featureMap = {
        'me': 1,
        'girls': 2,
        'jonesy': 3,
        'tryhard': 4
      };

      const featureId = featureMap[param];
      if (!featureId) {
        return ctx.reply('Parâmetro inválido! Use: admin, group, config, me, girls, jonesy ou tryhard');
      }

      const contents = await query(
        `SELECT id_fortme_contents, name, text, status 
         FROM tb_fortme_contents 
         WHERE fk_id_features = ? 
         ORDER BY id_fortme_contents ASC`,
        [featureId]
      );

      if (contents.length === 0) {
        return ctx.reply(`Nenhum conteúdo encontrado para ${param}.`);
      }

      let text = `<b>📋 Lista de ${param}:</b>\n\n`;
      contents.forEach((item, i) => {
        const statusIcon = item.status === 1 ? '✅' : '❌';
        const displayName = item.name || item.text || 'Sem nome';
        text += `${i + 1}. ${displayName} ${statusIcon}\n`;
        text += `   ID: ${item.id_fortme_contents}\n`;
        
        // Limitar para evitar mensagem muito longa
        if (i >= 49) {
          text += `\n... e mais ${contents.length - 50} itens`;
          return false;
        }
      });

      return ctx.reply(text, { parse_mode: 'HTML' });

    } catch (error) {
      console.error('[ERROR] Erro no comando /list:', error.message);
      return ctx.reply('❌ Erro ao acessar o banco de dados.');
    }
  });

  // Handler para remoção de admin via botão (mantido do código original)
  bot.action(/remove_admin_(\d+)/, async (ctx) => {
    const adminId = parseInt(ctx.match[1], 10);
    
    if (adminId === ctx.from.id) {
      return ctx.answerCbQuery('Você não pode se remover.');
    }

    const admins = config.admins || [];
    const index = admins.findIndex(a => a.id === adminId);
    
    if (index === -1) {
      return ctx.answerCbQuery('Administrador não encontrado.');
    }

    const removed = admins.splice(index, 1)[0];
    
    // Salvar no config.json (ainda mantém compatibilidade)
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '../../config/config.json');
    
    try {
      const fullConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      fullConfig.admins = admins;
      fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2), 'utf8');
      
      await ctx.editMessageText(
        `Administrador removido: <b>${removed.name}</b> (ID: <code>${removed.id}</code>)`, 
        { parse_mode: 'HTML' }
      );
      ctx.answerCbQuery('Administrador removido com sucesso.');
    } catch (error) {
      console.error('[ERROR] Erro ao remover admin:', error.message);
      return ctx.answerCbQuery('Erro ao salvar a configuração.');
    }
  });
};
