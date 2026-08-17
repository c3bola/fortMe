'use strict';

const {
  ensureUser,
  ensureBotGroup,
  getVariantsBySpriteId,
  getSpritesByName,
  getUserElementalConfig,
  recordHelp,
  getElementalCategories // Importado para validar as categorias dinamicamente
} = require('../../utils/databaseUtilsMySQL');

module.exports = (bot) => {
  // ─── Comando: /agradecer ──────────────────────────────────────────────────────

  bot.command('agradecer', async (ctx) => {
    console.log('[DEBUG] /agradecer', { chatId: ctx.chat?.id });
    
    // Captura o ID da mensagem do usuário que digitou o comando para responder diretamente a ele
    const replyId = ctx.message?.message_id;

    try {
      // 1. Validação de contexto
      if (ctx.chat.type === 'private') {
        return ctx.reply('⚠️ O comando /agradecer deve ser usado em um grupo!', { reply_to_message_id: replyId });
      }

      const repliedMsg = ctx.message?.reply_to_message;
      if (!repliedMsg) {
        return ctx.reply('⚠️ Você precisa responder a uma mensagem da pessoa que te ajudou para usar este comando!\nExemplo: Responda a mensagem dela com <code>/agradecer Duck</code>', { parse_mode: 'HTML', reply_to_message_id: replyId });
      }

      const helperId = repliedMsg.from.id.toString();
      const helpedId = ctx.from.id.toString();
      const groupId = ctx.chat.id.toString();

      // 2. Regras de negócio
      if (helperId === helpedId) {
        return ctx.reply('⚠️ Você não pode agradecer a si mesmo!', { reply_to_message_id: replyId });
      }

      if (repliedMsg.from.is_bot) {
        return ctx.reply('⚠️ Bots não precisam de agradecimentos, mas aprecio muito a intenção! 🤖', { reply_to_message_id: replyId });
      }

      // 3. Garantir os registros no banco (Helpers e Helped)
      await ensureUser(helpedId, 1, { first_name: ctx.from.first_name, username: ctx.from.username });
      await ensureUser(helperId, 1, { first_name: repliedMsg.from.first_name, username: repliedMsg.from.username });
      await ensureBotGroup(groupId, ctx.chat.title || 'Grupo');

      // 4. Identificar o sprite e a categoria de forma inteligente
      const args = ctx.message.text.split(/\s+/).slice(1).join(' ').trim();
      let variantId = null;
      let spriteName = '';
      let targetCategoryName = '';

      if (args) {
        const categories = await getElementalCategories();
        let spriteNameInput = args;
        let targetCategory = null;

        // Verifica de trás para frente se o usuário informou uma categoria no final da mensagem (Ex: metalizado)
        for (const cat of categories) {
          const catCode = cat.code.toLowerCase();
          const catName = cat.name.toLowerCase();

          const regexCode = new RegExp(`\\s+${catCode}$`, 'i');
          const regexName = new RegExp(`\\s+${catName}$`, 'i');

          if (regexCode.test(spriteNameInput)) {
            spriteNameInput = spriteNameInput.replace(regexCode, '').trim();
            targetCategory = cat;
            break;
          } else if (regexName.test(spriteNameInput)) {
            spriteNameInput = spriteNameInput.replace(regexName, '').trim();
            targetCategory = cat;
            break;
          }
        }

        const sprites = await getSpritesByName(spriteNameInput);

        if (sprites.length === 0) {
          return ctx.reply(`🔍 Nenhum sprite encontrado com o nome "<b>${spriteNameInput}</b>".\nVerifique o nome correto ou use apenas <code>/agradecer</code> para um agradecimento geral.`, { parse_mode: 'HTML', reply_to_message_id: replyId });
        }

        const variants = await getVariantsBySpriteId(sprites[0].id_elemental_sprite);
        
        if (variants.length > 0) {
          // Se identificou uma categoria na string do comando
          if (targetCategory) {
            const variantMatch = variants.find(v => v.fk_id_category === targetCategory.id_elemental_category);
            if (variantMatch) {
              variantId = variantMatch.id_elemental_variant;
              spriteName = sprites[0].name;
              targetCategoryName = targetCategory.name;
            } else {
              // Fallback se o sprite não tiver essa categoria ativa, usa a primeira
              variantId = variants[0].id_elemental_variant;
              spriteName = sprites[0].name;
            }
          } else {
            // Se não informou categoria, pega a primeira variante do sprite encontrada
            variantId = variants[0].id_elemental_variant;
            spriteName = sprites[0].name;
          }
        }
      }

      // 5. Registrar no banco com o variantId exato da combinação (Sprite + Categoria)
      await recordHelp(helperId, helpedId, groupId, variantId);

      // 6. Preparar a menção respeitando a configuração do ajudante
      const helperConfig = await getUserElementalConfig(helperId);
      const helperFirstName = repliedMsg.from.first_name;

      let mention = helperFirstName;
      if (helperConfig.allow_group_mention) {
        mention = repliedMsg.from.username
          ? `@${repliedMsg.from.username}`
          : `<a href="tg://user?id=${helperId}">${helperFirstName}</a>`;
      } else {
        mention = `<b>${helperFirstName}</b>`;
      }

      // 7. Preparar feedback público mostrando o Nome + Categoria (se houver)
      let text = `🎉 <b>Agradecimento Registrado!</b>\n\n`;
      if (spriteName) {
        const fullSpriteDisplayName = targetCategoryName ? `${spriteName} ${targetCategoryName}` : spriteName;
        text += `${ctx.from.first_name} registrou que conseguiu o sprite <b>${fullSpriteDisplayName}</b> com a ajuda de ${mention}.\n\n`;
      } else {
        text += `${ctx.from.first_name} registrou um agradecimento pela ajuda de ${mention}.\n\n`;
      }
      text += `Obrigado por fortalecer a comunidade! 🛡️`;

      // Responde à msg de quem solicitou o comando mantendo a resposta correta
      return ctx.reply(text, {
        parse_mode: 'HTML',
        reply_to_message_id: replyId
      });

    } catch (error) {
      console.error('[ERROR] /agradecer:', error.message);
      await ctx.reply('❌ Erro ao registrar o agradecimento. Tente novamente mais tarde.', { reply_to_message_id: replyId });
    }
  });
};