'use strict';

const fs = require('fs');

const {
  ensureUser,
  ensureBotGroup,
  getElementalCategories,
  getVariantsByCategory,
  getUserCollectionIds,
  getAllVariants
} = require('../../utils/databaseUtilsMySQL');

const {
  catEmoji,
  generateMissingMosaic
} = require('./elementalCommon'); 

module.exports = (bot) => {

  bot.command('faltam', async (ctx) => {
    const userId = ctx.from?.id?.toString();
    console.log(`[LOG] /faltam acionado pelo usuário ${userId}`);
    
    let tempMsg; 

    try {
      // 1. AVISA O USUÁRIO (Respondendo o comando original)
      tempMsg = await ctx.reply(
        '⏳ <b>Analisando sua jornada...</b>\n\nA geração da imagem dos elementais que faltam pode levar alguns instantes. Por favor, aguarde!', 
        { 
          parse_mode: 'HTML',
          reply_to_message_id: ctx.message?.message_id 
        }
      );

      await ensureUser(ctx.from.id.toString(), 1, { first_name: ctx.from.first_name, username: ctx.from.username });
      if (ctx.chat.type !== 'private') await ensureBotGroup(ctx.chat.id.toString(), ctx.chat.title || 'Grupo');

      const [categories, ownedIds, allVariants] = await Promise.all([
        getElementalCategories(),
        getUserCollectionIds(userId),
        getAllVariants() // O getAllVariants() já traz apenas os is_active = 1 do banco
      ]);

      // Calcula exatamente quantos elementais ATIVOS o usuário ainda não possui
      const missingActiveVariants = allVariants.filter(v => v.is_active === 1 && !ownedIds.has(v.id_elemental_variant));
      const missingCount = missingActiveVariants.length;

      // Se não falta nenhum elemental ativo, parabeniza e incentiva a ajuda no grupo
      if (missingCount === 0) {
        if (tempMsg) await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
        return await ctx.reply(
          '🏆 <b>Incrível! Parabéns!</b>\n\nVocê já obteve 100% dos elementais ativos no momento!\n\nAgora que sua coleção está completa, que tal ajudar os demais membros do grupo a completarem as deles? 🤝', 
          { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id }
        );
      }

      const categoryLines = [];
      for (const cat of categories) {
        if (cat.is_active !== 1) continue;
        // getVariantsByCategory também já traz apenas os is_active = 1
        const variants = await getVariantsByCategory(cat.id_elemental_category);
  
        const totalActive = variants.filter(v => v.is_active === 1).length;
        const ownedActive = variants.filter(v => v.is_active === 1 && ownedIds.has(v.id_elemental_variant)).length;
        const missingActive = totalActive - ownedActive;
        
        if (missingActive > 0) {
            categoryLines.push(`${catEmoji(cat.code)} <b>${cat.name}</b>: <i>Faltam ${missingActive}</i>`);
        }
      }

      const textLegenda = `🎯 <b>O que falta para sua coleção</b>\n\n${categoryLines.join('\n')}\n\n<i>Total: Ainda faltam ${missingCount} sprite(s) ativo(s).</i>`;
      
      // Prepara as opções da resposta final, garantindo que vai responder o comando original
      const replyOptions = {
        parse_mode: 'HTML',
        caption: textLegenda,
        reply_to_message_id: ctx.message?.message_id 
      };

      // 2. PROCESSAMENTO DA IMAGEM
      // (Certifique-se de que a função generateMissingMosaic também está filtrando os inativos internamente!)
      const mosaicPath = await generateMissingMosaic(userId);
      
      // 3. APAGA A MENSAGEM TEMPORÁRIA DE AVISO
      if (tempMsg) {
        await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
      }

      // 4. ENVIA O RESULTADO (Respondendo ao comando)
      if (fs.existsSync(mosaicPath)) {
        const stats = fs.statSync(mosaicPath);
        const fileSizeInBytes = stats.size;
        const tenMegabytesInBytes = 10 * 1024 * 1024; // 10.485.760 bytes

        if (fileSizeInBytes > tenMegabytesInBytes) {
          // Se for maior que 10MB, envia como documento (arquivo)
          await ctx.replyWithDocument(
            { source: fs.createReadStream(mosaicPath), filename: `faltam_${userId}.png` },
            replyOptions
          );
        } else {
          // Se for menor ou igual a 10MB, envia como foto normal
          await ctx.replyWithPhoto(
            { source: fs.createReadStream(mosaicPath) },
            replyOptions
          );
        }
        
        fs.unlinkSync(mosaicPath); 
      } else {
        // Fallback caso a imagem dê erro ao gerar, envia só o texto
        await ctx.reply(textLegenda, replyOptions);
      }

    } catch (error) {
      console.error('[ERROR] /faltam:', error.message);
      
      // Se der erro, tenta apagar a mensagem temporária (se existir) e avisa do erro
      if (tempMsg) {
        await ctx.telegram.deleteMessage(ctx.chat.id, tempMsg.message_id).catch(() => {});
      }
      await ctx.reply('❌ Erro ao carregar os elementais que faltam.', { reply_to_message_id: ctx.message?.message_id });
    }
  });
};