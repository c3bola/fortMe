'use strict';

const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

const catalogDb = require('../db/catalogDb');
const collectionDb = require('../db/collectionDb');

const IMAGES_BASE = path.join(__dirname, '../../../assets/images');

// ─── GERENCIADOR DE WORKERS (WORKER POOL) ───────────────────
class WorkerPool {
  constructor(workerPath, numWorkers) {
    this.idleWorkers = [];
    this.queue = [];
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(workerPath);
      this.idleWorkers.push(worker);
    }
  }

  runTask(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  processNext() {
    if (this.queue.length === 0 || this.idleWorkers.length === 0) return;

    const { task, resolve, reject } = this.queue.shift();
    const worker = this.idleWorkers.shift();

    // Cria listeners únicos para esta execução
    const onMessage = (msg) => {
      worker.removeListener('error', onError);
      this.idleWorkers.push(worker); // Devolve o worker pro pool
      this.processNext(); // Roda a próxima fila
      
      if (msg.success) resolve(msg.result);
      else reject(new Error(msg.error));
    };

    const onError = (err) => {
      worker.removeListener('message', onMessage);
      this.idleWorkers.push(worker);
      this.processNext();
      reject(err);
    };

    worker.once('message', onMessage);
    worker.once('error', onError);

    // Envia a tarefa para o worker agir
    worker.postMessage(task);
  }
}

// Inicia 2 threads em background
const workerPool = new WorkerPool(path.join(__dirname, 'imageWorker.js'), 2);

// ─── COMPILAÇÃO INDIVIDUAL DO CARD / ELEMENTAL ───────────────────
async function buildIndividualCard(variantName, categoryCode, categoryName, sourceFilename, outputFilename = null, includeBackground = false) {
  // Passa a tarefa para o worker
  const result = await workerPool.runTask({
    action: 'buildCard',
    payload: { variantName, categoryCode, categoryName, sourceFilename, outputFilename, includeBackground }
  });

  // Se não tem outputFilename, significa que pedimos a imagem em memória (Buffer)
  // O Worker envia um Uint8Array pela ponte de comunicação, então forçamos a conversão de volta para Buffer para o Telegram aceitar.
  if (!outputFilename) {
    return Buffer.from(result);
  }

  return result; // Se tiver outputFilename, ele retorna apenas a string do caminho do arquivo salvo
}

// ─── ORQUESTRAÇÃO DO MOSAICO ─────────────────────────────────
async function baseMosaicGenerator(userId, isMissing = false, validCategoryCodes = null) {
  const [ownedVariantIds, allVariants] = await Promise.all([
    collectionDb.getUserCollectionIds(userId),
    catalogDb.getAllVariants()
  ]);

  // (Sua lógica original de filtro permanece igual)
  let variantsToProcess = allVariants.filter(v => {
    const hasVariant = ownedVariantIds.has(v.id_elemental_variant);
    const active = v.is_active === 1;
    const matchStatus = isMissing ? !hasVariant : true;
    
    let matchCategory = true;
    if (validCategoryCodes && validCategoryCodes.length > 0) {
      matchCategory = validCategoryCodes.includes(v.category_code);
    }
    
    v.hasVariant = hasVariant;
    return active && matchStatus && matchCategory && v.image;
  });

  if (variantsToProcess.length === 0) return null;

  const grouped = {};
  for (const v of variantsToProcess) {
    const code = (v.category_code || 'basic').toLowerCase();
    if (!grouped[code]) {
      grouped[code] = { code, name: v.category_name, order: v.category_order || 99, items: [] };
    }
    grouped[code].items.push(v);
  }

  const sortedCategoryCodes = Object.keys(grouped).sort((a, b) => grouped[a].order - grouped[b].order);
  
  const bandLayouts = sortedCategoryCodes.map(code => {
    const band = grouped[code];
    band.items.sort((a, b) => {
      const nameA = (a.sprite_name || '').toLowerCase();
      const nameB = (b.sprite_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return band;
  });

  const outputDir = path.join(IMAGES_BASE, 'temp_mosaics');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const prefix = isMissing ? 'missing' : 'collection';
  const filterSufix = (validCategoryCodes && validCategoryCodes.length > 0) ? `_${validCategoryCodes.join('_')}` : '';
  const outputPath = path.join(outputDir, `${prefix}_${userId}${filterSufix}.jpg`);

  // Despacha o processamento pesado para o worker
  await workerPool.runTask({
    action: 'buildMosaic',
    payload: { bandLayouts, outputPath, validCategoryCodes }
  });
  
  return outputPath;
}

async function generateCollectionMosaic(userId, validCategoryCodes = null) {
  return await baseMosaicGenerator(userId, false, validCategoryCodes);
}

async function generateMissingMosaic(userId, validCategoryCodes = null) {
  return await baseMosaicGenerator(userId, true, validCategoryCodes);
}

module.exports = {
  buildIndividualCard,
  generateCollectionMosaic,
  generateMissingMosaic
};