'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config/mosaicConfig.json');

// Adicionado "short" para o botão e "desc" para a legenda da mensagem
const CONFIG_STEPS = {
  escurecimentoFundoGeral: { step: 1, short: 'Fundo', desc: 'Escurecimento do fundo (0 = original)' },
  escurecimentoBloqueados: { step: 1, short: 'Bloqueados', desc: 'Escurecimento de sprites não obtidos' },
  escalaFinal: { step: 0.05, short: 'Escala', desc: 'Tamanho geral do mosaico (Ex: 0.40)' },
  escalaSprite: { step: 0.05, short: 'Sprite', desc: 'Tamanho da imagem do sprite no card' },
  margemExterna: { step: 5, short: 'Margem', desc: 'Borda externa da imagem (px)' },
  espacoEntreItens: { step: 2, short: 'Esp. Itens', desc: 'Espaçamento horizontal entre cartas (px)' },
  espacoEntreLinhas: { step: 5, short: 'Esp. Categ', desc: 'Espaçamento entre diferentes categorias (px)' },
  espacoEntreLinhasGrid: { step: 5, short: 'Esp. Grid', desc: 'Espaçamento vertical quando quebra linha (px)' },
  alturaNomes: { step: 5, short: 'Alt. Texto', desc: 'Espaço reservado para o nome do card (px)' },
  MAX_COLS: { step: 1, short: 'Colunas', desc: 'Máximo de cartas por linha' }
};

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function writeConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function buildConfigKeyboard(currentConfig) {
  const keyboard = [];

  for (const [key, meta] of Object.entries(CONFIG_STEPS)) {
    const val = currentConfig[key] ?? 0;
    const displayVal = Number.isInteger(val) ? val : Number(val).toFixed(2);
    
    keyboard.push([
      { text: `➖`, callback_data: `mos_dec_${key}` },
      { text: `${meta.short}: ${displayVal}`, callback_data: 'noop' },
      { text: `➕`, callback_data: `mos_inc_${key}` }
    ]);
  }
  
  keyboard.push([{ text: '🗑️ Fechar', callback_data: 'el_close' }]);
  return { inline_keyboard: keyboard };
}

module.exports = (bot) => {
  bot.command('configmosaico', async (ctx) => {
    try {
      const config = readConfig();
      
      // Cria a legenda explicando o que cada botão faz
      let legenda = '⚙️ <b>Configuração do Mosaico</b>\n\nGuia de propriedades:\n\n';
      for (const [key, meta] of Object.entries(CONFIG_STEPS)) {
         legenda += `• <b>${meta.short}</b>: <i>${meta.desc}</i>\n`;
      }

      await ctx.reply(legenda, {
        parse_mode: 'HTML',
        reply_markup: buildConfigKeyboard(config)
      });
    } catch (e) {
      console.error('[ERROR] /configmosaico:', e.message);
    }
  });

  bot.action(/mos_(inc|dec)_(.+)/, async (ctx) => {
    const action = ctx.match[1];
    const key = ctx.match[2];
    
    const config = readConfig();
    const step = CONFIG_STEPS[key].step;
    
    let currentValue = config[key] ?? 0;
    
    if (action === 'inc') currentValue += step;
    else if (action === 'dec') {
      currentValue -= step;
      if (currentValue < 0) currentValue = 0;
    }

    config[key] = Number(currentValue.toFixed(2));
    writeConfig(config);

    try {
      await ctx.editMessageReplyMarkup(buildConfigKeyboard(config));
      await ctx.answerCbQuery();
    } catch (e) {
      await ctx.answerCbQuery().catch(()=>{});
    }
  });
};