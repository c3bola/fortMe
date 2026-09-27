'use strict';

const { parentPort } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

// Os builders pesados são importados APENAS no worker, livrando a thread principal
const cardBuilder = require('../utils/canvas/cardBuilder');
const mosaicBuilder = require('../utils/canvas/mosaicBuilder');

const IMAGES_BASE = path.join(__dirname, '../../../assets/images');

// Escuta as mensagens enviadas pela thread principal
parentPort.on('message', async (task) => {
  try {
    if (task.action === 'buildCard') {
      const { variantName, categoryCode, categoryName, sourceFilename, outputFilename, includeBackground } = task.payload;
      const withBg = outputFilename ? false : includeBackground;
      
      const finalImage = await cardBuilder.buildCard(variantName, categoryCode, categoryName, sourceFilename, withBg);

      if (outputFilename) {
        const outputPath = path.join(IMAGES_BASE, 'elementais', outputFilename);
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        await finalImage.writeAsync(outputPath);
        parentPort.postMessage({ success: true, result: outputPath });
      } else {
        // Se não tiver output, gera o buffer para enviar ao Telegram
        const buffer = await finalImage.getBufferAsync(Jimp.MIME_PNG);
        parentPort.postMessage({ success: true, result: buffer });
      }

    } else if (task.action === 'buildMosaic') {
      const { bandLayouts, outputPath, validCategoryCodes } = task.payload;
      let finalMosaic;
      
      if (validCategoryCodes && bandLayouts.length === 1) {
        finalMosaic = await mosaicBuilder.buildGridMosaic(bandLayouts[0]);
      } else {
        finalMosaic = await mosaicBuilder.buildBandMosaic(bandLayouts);
      }
      
      finalMosaic.quality(85);
      await finalMosaic.writeAsync(outputPath);
      parentPort.postMessage({ success: true, result: outputPath });
    }
  } catch (error) {
    // parentPort.postMessage({ success: false, error: error.message });
    console.error('[ERROR] /comando:', error);
      await sendErrorLog(ctx, 'Falha na execução do comando /comando', error);
      await ctx.reply('❌ Ocorreu um erro inesperado. O problema foi registrado e será corrigido em breve.', { reply_to_message_id: replyId });
  }
});