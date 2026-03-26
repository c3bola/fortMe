const config = require('../../config/config');
const { query } = require('../../database/dbConnection');
const { ensureUser, updateUserMetadata } = require('../../utils/databaseUtilsMySQL');

/**
 * Verifica se o usuário é administrador (perfil 4 ou 5)
 * @param {number|string} userId - ID do usuário
 * @returns {Promise<{isAdmin: boolean, isSuperAdmin: boolean, profile: number}>}
 */
async function checkAdminPermission(userId) {
  try {
    const result = await query(
      'SELECT fk_id_profile FROM tb_user WHERE id_user = ?',
      [String(userId)]
    );
    
    if (result.length === 0) {
      return { isAdmin: false, isSuperAdmin: false, profile: 0 };
    }
    
    const profile = result[0].fk_id_profile;
    return {
      isAdmin: profile === 4 || profile === 5,
      isSuperAdmin: profile === 4,
      profile: profile
    };
  } catch (error) {
    console.error('[ERROR] Erro ao verificar permissão de admin:', error.message);
    return { isAdmin: false, isSuperAdmin: false, profile: 0 };
  }
}

/**
 * Lista todos os administradores do bot
 * @returns {Promise<Array>}
 */
async function listAdmins() {
  try {
    const admins = await query(
      `SELECT u.id_user, p.name_profile, p.id_profile,
              m.value as first_name, m2.value as username
       FROM tb_user u
       JOIN tb_profile p ON u.fk_id_profile = p.id_profile
       LEFT JOIN tb_data_user m ON u.id_user = m.fk_id_user AND m.fk_id_metadata = 1
       LEFT JOIN tb_data_user m2 ON u.id_user = m2.fk_id_user AND m2.fk_id_metadata = 3
       WHERE u.fk_id_profile IN (4, 5)
       ORDER BY p.id_profile ASC, u.id_user ASC`
    );
    return admins;
  } catch (error) {
    console.error('[ERROR] Erro ao listar admins:', error.message);
    return [];
  }
}

/**
 * Formata a lista de admins para exibição
 * @param {Array} admins - Lista de administradores
 * @returns {string}
 */
function formatAdminList(admins) {
  if (admins.length === 0) {
    return 'Nenhum administrador encontrado.';
  }

  let text = '<b>👥 Administradores do Bot:</b>\n\n';
  
  const superAdmins = admins.filter(a => a.id_profile === 4);
  const regularAdmins = admins.filter(a => a.id_profile === 5);
  
  if (superAdmins.length > 0) {
    text += '<b>🔱 Super Administradores:</b>\n';
    superAdmins.forEach(admin => {
      const name = admin.first_name || admin.username || 'Sem nome';
      text += `• ${name} - ID: <code>${admin.id_user}</code>\n`;
    });
    text += '\n';
  }
  
  if (regularAdmins.length > 0) {
    text += '<b>👑 Administradores:</b>\n';
    regularAdmins.forEach(admin => {
      const name = admin.first_name || admin.username || 'Sem nome';
      text += `• ${name} - ID: <code>${admin.id_user}</code>\n`;
    });
  }
  
  return text;
}

module.exports = (bot) => {
  // Comando /addAdmin - Adicionar administrador
  bot.command('addAdmin', async (ctx) => {
    try {
      // Verificar permissão
      const permission = await checkAdminPermission(ctx.from.id);
      if (!permission.isAdmin) {
        return ctx.reply('❌ Você não tem permissão para usar este comando.');
      }

      let adminId, adminName;

      // Verificar se é resposta a uma mensagem
      if (ctx.message.reply_to_message) {
        adminId = ctx.message.reply_to_message.from.id;
        adminName = ctx.message.reply_to_message.from.first_name || ctx.message.reply_to_message.from.username || 'Admin';
      } else {
        const message = ctx.message.text.split(' ');

        if (message.length < 2) {
          // Mostrar sintaxe e lista de admins
          const admins = await listAdmins();
          const adminList = formatAdminList(admins);
          
          return ctx.reply(
            '📋 <b>Como adicionar um administrador:</b>\n\n' +
            '<b>Formato 1:</b> <code>/addAdmin id!!nome</code>\n' +
            'Exemplo: <code>/addAdmin 123456789!!João</code>\n\n' +
            '<b>Formato 2:</b> Responda a mensagem do usuário com <code>/addAdmin</code>\n\n' +
            '━━━━━━━━━━━━━━━━━━━━\n\n' +
            adminList,
            { parse_mode: 'HTML' }
          );
        }

        const param = message[1];
        
        if (param.includes('!!')) {
          [adminId, adminName] = param.split('!!');
        } else {
          return ctx.reply(
            '❌ <b>Formato inválido!</b>\n\n' +
            'Use: <code>/addAdmin id!!nome</code>\n' +
            'Ou responda a mensagem do usuário com <code>/addAdmin</code>',
            { parse_mode: 'HTML' }
          );
        }
      }

      if (!adminId || !adminName) {
        return ctx.reply('❌ Erro: ID ou nome inválido.');
      }

      adminId = String(adminId);

      // Verificar se o usuário já existe no banco
      const existingUser = await query(
        'SELECT u.id_user, u.fk_id_profile, p.name_profile FROM tb_user u ' +
        'JOIN tb_profile p ON u.fk_id_profile = p.id_profile ' +
        'WHERE u.id_user = ?',
        [adminId]
      );

      if (existingUser.length > 0) {
        // Usuário existe - verificar se já é admin
        if (existingUser[0].fk_id_profile === 4) {
          return ctx.reply(`⚠️ O usuário <b>${adminName}</b> (ID: <code>${adminId}</code>) já é Super Administrador!`, { parse_mode: 'HTML' });
        }
        if (existingUser[0].fk_id_profile === 5) {
          return ctx.reply(`⚠️ O usuário <b>${adminName}</b> (ID: <code>${adminId}</code>) já é Administrador!`, { parse_mode: 'HTML' });
        }

        // Atualizar para administrador
        await query(
          'UPDATE tb_user SET fk_id_profile = 5 WHERE id_user = ?',
          [adminId]
        );

        // Atualizar metadados se tiver informações do Telegram
        if (ctx.message.reply_to_message) {
          await updateUserMetadata(adminId, {
            first_name: ctx.message.reply_to_message.from.first_name,
            last_name: ctx.message.reply_to_message.from.last_name,
            username: ctx.message.reply_to_message.from.username
          });
        }
      } else {
        // Usuário não existe - criar como admin (perfil 5)
        await ensureUser(adminId, 5, {
          first_name: adminName,
          username: adminName
        });
      }

      const successMessage = `✅ <b>Administrador adicionado com sucesso!</b>\n\n` +
        `👤 <b>Nome:</b> ${adminName}\n` +
        `🆔 <b>ID:</b> <code>${adminId}</code>\n` +
        `👑 <b>Perfil:</b> Administrador FortMe`;

      await ctx.reply(successMessage, { parse_mode: 'HTML' });

      // Log no grupo de logs
      if (config.logGroup?.status && config.logGroup?.id) {
        const logMessage = `✅ <b>Novo Administrador Adicionado</b>\n\n` +
          `👤 <b>Nome:</b> ${adminName}\n` +
          `🆔 <b>ID:</b> <code>${adminId}</code>\n` +
          `👤 <b>Adicionado por:</b> ${ctx.from.first_name || ctx.from.username} (ID: ${ctx.from.id})\n` +
          `🕒 <b>Horário:</b> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
        
        bot.telegram.sendMessage(config.logGroup.id, logMessage, {
          parse_mode: 'HTML',
          message_thread_id: config.logGroup.topic || undefined
        }).catch(err => console.error('[ERROR] Falha ao enviar log:', err.message));
      }

    } catch (error) {
      console.error('[ERROR] Erro ao adicionar administrador:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      ctx.reply('❌ Erro ao adicionar administrador. Tente novamente.');
    }
  });

  // Comando /rmAdmin - Remover administrador
  bot.command('rmAdmin', async (ctx) => {
    try {
      // Verificar permissão
      const permission = await checkAdminPermission(ctx.from.id);
      if (!permission.isAdmin) {
        return ctx.reply('❌ Você não tem permissão para usar este comando.');
      }

      let adminId, adminName;

      // Verificar se é resposta a uma mensagem
      if (ctx.message.reply_to_message) {
        adminId = ctx.message.reply_to_message.from.id;
        adminName = ctx.message.reply_to_message.from.first_name || ctx.message.reply_to_message.from.username || 'Usuário';
      } else {
        const message = ctx.message.text.split(' ');

        if (message.length < 2) {
          // Mostrar sintaxe e lista de admins
          const admins = await listAdmins();
          const adminList = formatAdminList(admins);
          
          return ctx.reply(
            '📋 <b>Como remover um administrador:</b>\n\n' +
            '<b>Formato 1:</b> <code>/rmAdmin id</code>\n' +
            'Exemplo: <code>/rmAdmin 123456789</code>\n\n' +
            '<b>Formato 2:</b> Responda a mensagem do usuário com <code>/rmAdmin</code>\n\n' +
            '⚠️ <b>Observação:</b> Super Administradores (perfil 4) não podem ser removidos.\n\n' +
            '━━━━━━━━━━━━━━━━━━━━\n\n' +
            adminList,
            { parse_mode: 'HTML' }
          );
        }

        adminId = message[1];
        adminName = null;
      }

      if (!adminId) {
        return ctx.reply('❌ Erro: ID inválido.');
      }

      adminId = String(adminId);

      // Verificar se o usuário existe e é admin
      const existingUser = await query(
        'SELECT u.id_user, u.fk_id_profile, p.name_profile FROM tb_user u ' +
        'JOIN tb_profile p ON u.fk_id_profile = p.id_profile ' +
        'WHERE u.id_user = ?',
        [adminId]
      );

      if (existingUser.length === 0) {
        return ctx.reply(`❌ Usuário com ID <code>${adminId}</code> não encontrado.`, { parse_mode: 'HTML' });
      }

      const userProfile = existingUser[0].fk_id_profile;

      // Verificar se é Super Admin (não pode ser removido)
      if (userProfile === 4) {
        return ctx.reply(`🔱 <b>Super Administradores não podem ser removidos!</b>\n\nID: <code>${adminId}</code>`, { parse_mode: 'HTML' });
      }

      // Verificar se é administrador
      if (userProfile !== 5) {
        return ctx.reply(`⚠️ O usuário com ID <code>${adminId}</code> não é administrador.`, { parse_mode: 'HTML' });
      }

      // Obter nome do usuário
      if (!adminName) {
        const metadata = await query(
          'SELECT value FROM tb_data_user WHERE fk_id_user = ? AND fk_id_metadata = 1',
          [adminId]
        );
        adminName = metadata.length > 0 ? metadata[0].value : 'Usuário';
      }

      // Remover privilégios de admin (trocar para perfil 1 - usuário comum)
      await query(
        'UPDATE tb_user SET fk_id_profile = 1 WHERE id_user = ?',
        [adminId]
      );

      const successMessage = `✅ <b>Administrador removido com sucesso!</b>\n\n` +
        `👤 <b>Nome:</b> ${adminName}\n` +
        `🆔 <b>ID:</b> <code>${adminId}</code>\n` +
        `📝 <b>Novo Perfil:</b> Usuário Comum`;

      await ctx.reply(successMessage, { parse_mode: 'HTML' });

      // Log no grupo de logs
      if (config.logGroup?.status && config.logGroup?.id) {
        const logMessage = `⚠️ <b>Administrador Removido</b>\n\n` +
          `👤 <b>Nome:</b> ${adminName}\n` +
          `🆔 <b>ID:</b> <code>${adminId}</code>\n` +
          `👤 <b>Removido por:</b> ${ctx.from.first_name || ctx.from.username} (ID: ${ctx.from.id})\n` +
          `🕒 <b>Horário:</b> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
        
        bot.telegram.sendMessage(config.logGroup.id, logMessage, {
          parse_mode: 'HTML',
          message_thread_id: config.logGroup.topic || undefined
        }).catch(err => console.error('[ERROR] Falha ao enviar log:', err.message));
      }

    } catch (error) {
      console.error('[ERROR] Erro ao remover administrador:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      ctx.reply('❌ Erro ao remover administrador. Tente novamente.');
    }
  });
};

// Exportar função de verificação para uso em outros arquivos
module.exports.checkAdminPermission = checkAdminPermission;
