/**
 * Script de Geração de Sprites (Estável - Jimp v0.16.1)
 * Alinhado perfeitamente com o template visual do DUCK
 * Uso: node create_sprites.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Variável de controle: define se as imagens já existentes no diretório devem ser recriadas.
const force = true; 

// ─── Diretórios e Configurações ──────────────────────────────────────────────
const JSON_PATH = path.join(__dirname, 'elementais_dados.json');
const DIR_BACKGROUND = path.join(__dirname, 'background');
const DIR_SPRITE_ORIGINAL = path.join(__dirname, 'sprite_original');
const DIR_FONTS = path.join(__dirname, 'fonts/burbark');
const OUTPUT_DIR = path.join(__dirname, 'elementais');
const LAYOUT = {
    titleY: 80,
    titleCategoryGap: 12,
    categoryFont: 48
};

// Mapeamento de cores numéricas hexadecimais RGBA puros para a versão 0.16.1 (Glow/Linhas)
const CATEGORY_COLORS = {
    'Básico': 0xFFFFFFFF,      // Branco
    'Dourado': 0xFFD700FF,     // Dourado
    'Gelatina': 0xFFC0CBFF,    // Rosa
    'Galáxia': 0x8A2BE2FF,     // Roxo
    'Gema': 0x00FFFFFF,        // Ciano
    'Metalizados': 0xE0FFFFFF, // Prata/Holo
    'Cubo': 0x9932CCFF,        // Roxo Escuro
    'Especial': 0xFFA500FF     // Laranja
};

// ─── Funções Auxiliares ──────────────────────────────────────────────────────

const FONT_SIZES = [
    200, 180, 160, 140, 120, 100, 90, 64, 52, 50, 48, 34, 32, 20, 16
];

const LoadedFonts = {};

function getBestFont(text, maxWidth) {
    for (const size of FONT_SIZES) {
        const font = LoadedFonts[size];
        if (!font) continue;
        const width = Jimp.measureText(font, text);
        if (width <= maxWidth) {
            return font;
        }
    }
    throw new Error(`Nenhuma fonte encontrada para "${text}"`);
}

async function loadBurbankFont(sizeSuffix) {
    const fontPath = path.join(DIR_FONTS, `burbark_${sizeSuffix}.fnt`);
    if (fs.existsSync(fontPath)) {
        return await Jimp.loadFont(fontPath);
    }
    console.warn(`[WARN] Fonte burbark_${sizeSuffix}.fnt não localizada. Usando fonte padrão.`);
    return await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
}

async function loadAllFonts() {
    for (const size of FONT_SIZES) {
        const fontPath = path.join(DIR_FONTS, `burbark_${size}.fnt`);
        if (fs.existsSync(fontPath)) {
            console.log("Fonte carregada:", size);
            LoadedFonts[size] = await Jimp.loadFont(fontPath);
        }
    }
}

// ─── Sincronização de Diretório e JSON ───────────────────────────────────────

const CATEGORY_MAPPING = {
    'basic': 'Básico',
    'gold': 'Dourado',
    'candy': 'Gelatina',
    'galaxy': 'Galáxia',
    'holofoil': 'Metalizados',
    'gem': 'Gem',
    'rift': 'Cubo'
};

function syncJsonWithDirectory() {
    console.log('[LOG] Sincronizando diretório de sprites com o JSON...');
    
    let spritesData = [];
    if (fs.existsSync(JSON_PATH)) {
        const rawData = fs.readFileSync(JSON_PATH, 'utf8');
        spritesData = JSON.parse(rawData);
    } else {
        console.warn('[WARN] JSON não encontrado, criando um novo array de dados.');
    }

    // Suporta tanto array direto quanto objeto com propriedade "sprites"
    const items = Array.isArray(spritesData) ? spritesData : (spritesData.sprites || []);
    const existingFiles = items.map(item => item.image_filename);
    
    if (!fs.existsSync(DIR_SPRITE_ORIGINAL)) {
        fs.mkdirSync(DIR_SPRITE_ORIGINAL, { recursive: true });
    }

    const files = fs.readdirSync(DIR_SPRITE_ORIGINAL).filter(f => f.endsWith('.png'));
    let jsonUpdated = false;

    // 1. Varredura e criação de nós padrões
    files.forEach(file => {
        if (!existingFiles.includes(file)) {
            // Separa o nome, ex: water_candy.png -> ['water', 'candy']
            const nameParts = file.replace('.png', '').split('_');
            const spriteNameEn = nameParts[0]; 
            const categoryEn = nameParts[1] || 'basic';
            
            const categoryPt = CATEGORY_MAPPING[categoryEn] || 'Básico';
            const isSpecial = categoryEn !== 'basic';

            const newNode = {
                sprite_slug: `${isSpecial ? categoryEn + '-' : ''}${spriteNameEn}-sprite`,
                display_name: spriteNameEn.charAt(0).toUpperCase() + spriteNameEn.slice(1), // Nome temporário
                description: "nd",
                category_code: categoryPt,
                rarity_name: isSpecial ? "Special" : "Rare",
                location: "nd",
                summon_cost: 0,
                drop_chance: 0.00,
                image_filename: file
            };
            
            items.push(newNode);
            jsonUpdated = true;
            console.log(`[SYNC] Adicionado novo sprite ao JSON: ${file}`);
        }
    });

    // 2. Atualização específica dos dados do John Wick
    const wickIndex = items.findIndex(item => item.image_filename === 'wick_basic.png');
    if (wickIndex !== -1) {
        // Verifica se a descrição já foi atualizada para evitar regravar à toa
        const wickDesc = "Revela inimigos próximos após um nocaute ou eliminação. Seu nível permanece exatamente como encontrado. Atualmente o único Sprite utilizável em Reload. Resgatá-lo em Reload o desbloqueia para Battle Royale.";
        
        if (items[wickIndex].description !== wickDesc) {
            items[wickIndex] = {
                ...items[wickIndex],
                display_name: "John Wick",
                description: wickDesc,
                location: "Encontrado em Baús regulares/Sprite, inimigos ou ao vencer",
                rarity_name: "Mythic", // Mantém a raridade mítica
                category_code: "Básico"
            };
            jsonUpdated = true;
            console.log(`[SYNC] Dados do John Wick (wick_basic.png) atualizados com sucesso.`);
        }
    }

    // 3. Salva as modificações no arquivo JSON
    if (jsonUpdated) {
        const outputData = Array.isArray(spritesData) ? items : { sprites: items };
        fs.writeFileSync(JSON_PATH, JSON.stringify(outputData, null, 2), 'utf8');
        console.log('[LOG] elementais_dados.json atualizado e salvo.');
    } else {
        console.log('[LOG] Diretório e JSON já estão sincronizados.');
    }
}

// ─── Processamento Principal ──────────────────────────────────────────────────

async function processAllSprites() {
    // Roda a sincronização antes de iniciar o processo de imagens
    syncJsonWithDirectory();

    console.log('[LOG] Lendo elementais_dados.json na raiz do diretório images...');

    if (!fs.existsSync(JSON_PATH)) {
        console.error(`[ERROR] Arquivo JSON não encontrado em: ${JSON_PATH}`);
        return;
    }

    const rawData = fs.readFileSync(JSON_PATH, 'utf8');
    const spritesData = JSON.parse(rawData);

    console.log('[LOG] Lendo elementais_dados.json na raiz do diretório images...');

    if (!fs.existsSync(JSON_PATH)) {
        console.error(`[ERROR] Arquivo JSON não encontrado em: ${JSON_PATH}`);
        return;
    }

    // const rawData = fs.readFileSync(JSON_PATH, 'utf8');
    // const spritesData = JSON.parse(rawData);

    const items = Array.isArray(spritesData) ? spritesData : spritesData.sprites;

    if (!items || items.length === 0) {
        console.warn('[WARN] Nenhum item encontrado no arquivo JSON.');
        return;
    }

    console.log(`[LOG] Encontrados ${items.length} registros para processing.`);
    await loadAllFonts();
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const item of items) {
        try {
            const spriteFilename = path.basename(item.image_filename);
            const spriteSourcePath = path.join(DIR_SPRITE_ORIGINAL, spriteFilename);
            
            const outputFileName = `${path.basename(spriteFilename, path.extname(spriteFilename))}.png`;
            const outputPath = path.join(OUTPUT_DIR, outputFileName);

            // Verificação se a imagem já existe e force está desligado
            if (!force && fs.existsSync(outputPath)) {
                console.log(`[SKIP] Arquivo já existe e force = false: ${outputFileName}`);
                continue;
            }

            if (!fs.existsSync(spriteSourcePath)) {
                console.warn(`[SKIP] Imagem do sprite original não localizada em disco: ${spriteFilename}`);
                continue;
            }

            // Regra de Background Dinâmico (agora mapeado pela categoria do JSON)
            const CATEGORY_BG_MAP = {
                'Básico': 'basic.png',
                'Dourado': 'gold.png',
                'Gelatina': 'candy.png',
                'Galáxia': 'galaxy.png',
                'Gema': 'gem.png',
                'Metalizados': 'holofoil.png',
                'Cubo': 'cube.png',
                'Especial': 'special.png'
            };

            const bgName = CATEGORY_BG_MAP[item.category_code] || 'Base.png';
            let bgPath = path.join(DIR_BACKGROUND, bgName);

            // Fallback caso a imagem não exista na pasta background
            if (!fs.existsSync(bgPath)) {
                bgPath = path.join(DIR_BACKGROUND, 'Base.png');
            }

            console.log(`[PROCESSING] Gerando arte para: ${item.display_name} (${item.category_code})`);

            const bgImage = await Jimp.read(bgPath);
            const spriteOriginal = await Jimp.read(spriteSourcePath);

            const targetWidth = bgImage.bitmap.width;
            const targetHeight = bgImage.bitmap.width;
            spriteOriginal.resize(targetWidth, targetHeight);

            const glowHexColor = CATEGORY_COLORS[item.category_code] || 0xFFFFFFFF;
            const glowImg = spriteOriginal.clone();
            try {
                glowImg.color([{ apply: 'xor', params: [glowHexColor] }]);
            } catch (e) { }

            const finalImage = bgImage.clone();

            const posX = (finalImage.bitmap.width - targetWidth) / 2;
            const posY = (finalImage.bitmap.height - targetHeight) / 2;

            const glowSombra = glowImg.clone().opacity(0.3);
            finalImage.composite(glowSombra, posX - 5, posY - 5);
            finalImage.composite(spriteOriginal, posX, posY);

            const nameText = (item.display_name || '').toUpperCase();
            const fontName = getBestFont(nameText, finalImage.bitmap.width * 0.72);
            const textWidth = Jimp.measureText(fontName, nameText);
            const nameX = (finalImage.bitmap.width - textWidth) / 2;

            finalImage.print(fontName, nameX, 80, nameText);

            const catDisplayName = (item.category_code || '').toUpperCase();
            const fontCat = LoadedFonts[LAYOUT.categoryFont];

            const catTextWidth = Jimp.measureText(fontCat, catDisplayName);
            const catTextHeight = Jimp.measureTextHeight(fontCat, catDisplayName, finalImage.bitmap.width);
            const catX = (finalImage.bitmap.width - catTextWidth) / 2;
          
            const nameHeight = Jimp.measureTextHeight(fontName, nameText, finalImage.bitmap.width);
            const catY = LAYOUT.titleY + nameHeight + LAYOUT.titleCategoryGap;

            finalImage.print(fontCat, catX, catY, catDisplayName);

            const lineColorHex = CATEGORY_COLORS[item.category_code] || 0xFFFFFFFF;
            const lineY = catY + Math.round(catTextHeight / 2); 
            const lineLength = 120; 
            const gap = 35;

            const startLeftX = Math.round(catX - gap - lineLength);
            for (let lx = startLeftX; lx < startLeftX + lineLength; lx++) {
                if (lx >= 0 && lx < finalImage.bitmap.width) {
                    finalImage.setPixelColor(lineColorHex, lx, Math.round(lineY));
                    finalImage.setPixelColor(lineColorHex, lx, Math.round(lineY + 1));
                }
            }

            const startRightX = Math.round(catX + catTextWidth + gap);
            for (let rx = startRightX; rx < startRightX + lineLength; rx++) {
                if (rx < finalImage.bitmap.width) {
                    finalImage.setPixelColor(lineColorHex, rx, Math.round(lineY));
                    finalImage.setPixelColor(lineColorHex, rx, Math.round(lineY + 1));
                }
            }

            await finalImage.writeAsync(outputPath);
            console.log(`[SUCCESS] Salvo: ${outputPath}`);

        } catch (itemErr) {
            console.error(`[ERROR] Falha ao compor ${item.display_name}:`, itemErr.message);
        }
    }

    console.log('[SUCCESS] Processo de geração de artes finalizado.');
}

processAllSprites();