const { query } = require('../../database/dbConnection');
const { ensureUser } = require('../../utils/databaseUtilsMySQL');
const config = require('../../config/config');

// Mapa de features por código
const FEATURES_MAP = {
  'girls': { id: 2, code: 'fortgirl', name: 'FortGirl' },
  'me': { id: 1, code: 'fortme', name: 'FortMe' },
  'jonesy': { id: 3, code: 'jonesyme', name: 'Jonesy' },
  'tryhard': { id: 4, code: 'tryhardme', name: 'Tryhard' }
};

// Função para limpar e extrair o nome da legenda
const extractNameFromCaption = (caption) => {
  if (!caption) return null;
  const cleanCaption = caption.replace(/<\/?[^>]+(>|$)/g, ''); // Remove tags HTML
  const nameMatch = cleanCaption.match(/Nome:\s*(.+)/i);
  return nameMatch ? nameMatch[1].trim() : null;
};

// Função para escapar caracteres especiais no Markdown
const escapeMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/~/g, '\\~')
    .replace(/\|/g, '\\|');
};

module.exports = (bot) => {
  bot.command('register', async (ctx) => {
    try {
      console.log('[DEBUG] Comando /register iniciado', { userId: ctx.from?.id });

      // Validar resposta a uma imagem
      if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
        return ctx.reply('Por favor, responda a uma imagem com o comando.\n\nUso: /register <tipo>#<descrição>\n\nTipos disponíveis: girls, me, jonesy, tryhard');
      }

      // Parsear argumentos: /register girls#Descrição da skin
      const args = ctx.message.text.split(' ').slice(1).join(' ');
      if (!args || !args.includes('#')) {
        return ctx.reply('Formato inválido!\n\nUso: /register <tipo>#<descrição>\n\nExemplo: /register girls#Skin Ramirez Rosa');
      }

      const [typeArg, ...descParts] = args.split('#');
      const type = typeArg.trim().toLowerCase();
      const description = descParts.join('#').trim();

      if (!description) {
        return ctx.reply('Por favor, forneça uma descrição após o #');
      }

      // Validar tipo
      const feature = FEATURES_MAP[type];
      if (!feature) {
        return ctx.reply(
          `Tipo inválido: "${type}"\n\n` +
          `Tipos disponíveis:\n` +
          `- girls (FortGirl)\n` +
          `- me (FortMe)\n` +
          `- jonesy (Jonesy)\n` +
          `- tryhard (Tryhard)`
        );
      }

      const photo = ctx.message.reply_to_message.photo.pop(); // Melhor qualidade
      const adminName = ctx.from.username || ctx.from.first_name;
      const adminId = ctx.from.id.toString();

      // Extrair nome da legenda da imagem (se existir)
      const imageCaption = ctx.message.reply_to_message.caption || '';
      const extractedName = extractNameFromCaption(imageCaption);

      // Garantir que o admin existe no banco
      await ensureUser(adminId, 4, {
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username
      });

      // Verificar se já existe conteúdo com esse image_id
      const existing = await query(
        'SELECT * FROM tb_fortme_contents WHERE image_id = ? AND fk_id_features = ?',
        [photo.file_id, feature.id]
      );

      let contentId;
      const now = new Date();

      if (existing.length > 0) {
        // Atualizar existente
        contentId = existing[0].id_fortme_contents;
        await query(
          `UPDATE tb_fortme_contents 
           SET text = ?, name = ?, created_by = ?, status = 1, created_at = ?
           WHERE id_fortme_contents = ?`,
          [description, extractedName || '', adminId, now, contentId]
        );

        console.log('[INFO] Conteúdo atualizado', { contentId, feature: feature.code });
        await ctx.reply(`✅ Imagem atualizada com sucesso!\n\n🆔 ID: ${contentId}\n📂 Tipo: ${feature.name}\n✏️ Descrição: ${description}`);
      } else {
        // Inserir novo
        const result = await query(
          `INSERT INTO tb_fortme_contents 
           (fk_id_features, created_by, name, text, image_id, status, created_at)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [feature.id, adminId, extractedName || '', description, photo.file_id, now]
        );

        contentId = result.insertId;
        console.log('[INFO] Conteúdo criado', { contentId, feature: feature.code });
        await ctx.reply(`✅ Imagem registrada com sucesso!\n\n🆔 ID: ${contentId}\n📂 Tipo: ${feature.name}\n✏️ Descrição: ${description}`);
      }

      // Enviar log para o grupo de logs
      if (config.logGroup && config.logGroup.status && config.logGroup.id) {
        try {
          const escapedDescription = escapeMarkdown(description);
          const escapedName = escapeMarkdown(extractedName || 'Não especificado');
          const escapedAdminName = escapeMarkdown(adminName);

          const logCaption = 
            `📥 *Imagem ${existing.length > 0 ? 'atualizada' : 'registrada'}!*\n\n` +
            `🆔 *ID*: ${contentId}\n` +
            `📂 *Tipo*: ${feature.name}\n` +
            `✏️ *Descrição*: ${escapedDescription}\n` +
            `🏷️ *Nome*: ${escapedName}\n` +
            `👤 *Admin*: ${escapedAdminName} (ID: ${adminId})\n` +
            `📅 *Data*: ${now.toISOString()}`;

          const options = {
            caption: logCaption,
            parse_mode: 'Markdown'
          };

          if (config.logGroup.topic) {
            options.message_thread_id = config.logGroup.topic;
          }

          await bot.telegram.sendPhoto(config.logGroup.id, photo.file_id, options);
          console.log('[INFO] Log enviado para o grupo de logs');
        } catch (logError) {
          console.error('[ERROR] Falha ao enviar log:', logError.message);
        }
      }

    } catch (error) {
      console.error('[ERROR] Erro no comando /register:', error.message);
      console.error('[ERROR] Stack trace:', error.stack);
      try {
        await ctx.reply('❌ Ocorreu um erro ao registrar a imagem. Verifique os logs.');
      } catch (replyError) {
        console.error('[ERROR] Falha ao enviar mensagem de erro:', replyError.message);
      }
    }
  });
};
