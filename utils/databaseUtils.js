const fs = require('fs');
const path = require('path');

/**
 * Lê um arquivo JSON e retorna os dados. Se o arquivo não existir ou estiver corrompido, retorna um objeto vazio.
 * @param {string} filePath - Caminho do arquivo JSON.
 * @returns {object} - Dados do arquivo JSON.
 */
function readDatabase(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (typeof data !== 'object') {
      throw new Error('Dados inválidos no arquivo JSON.');
    }
    return data;
  } catch (error) {
    console.error(`[ERROR] Falha ao ler o arquivo ${filePath}:`, error.message);
    return {};
  }
}

/**
 * Escreve dados em um arquivo JSON.
 * @param {string} filePath - Caminho do arquivo JSON.
 * @param {object} data - Dados a serem salvos.
 */
function writeDatabase(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[INFO] Dados salvos com sucesso no arquivo ${filePath}.`);
  } catch (error) {
    console.error(`[ERROR] Falha ao salvar no arquivo ${filePath}:`, error.message);
  }
}

/**
 * Inicializa a estrutura de dados para um grupo e uma data, se necessário.
 * @param {object} database - Objeto do banco de dados.
 * @param {string} groupId - ID do grupo.
 * @param {string} date - Data no formato YYYY-MM-DD.
 * @param {string} groupName - Nome do grupo.
 */
function initializeGroupData(database, groupId, date, groupName = 'Grupo sem nome') {
  if (!database[groupId]) {
    database[groupId] = { name: groupName }; // Adiciona o nome do grupo na estrutura
  }
  if (!database[groupId][date]) {
    database[groupId][date] = {};
  }
}

/**
 * Verifica se o comando foi executado em um grupo.
 * @param {object} ctx - Contexto do comando.
 * @returns {boolean} - Retorna `true` se o comando foi executado em um grupo, caso contrário `false`.
 */
function isGroupCommand(ctx) {
  return ctx.chat && ctx.chat.type && (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup');
}

/**
 * Retorna informações do grupo, como ID, nome e username.
 * @param {object} ctx - Contexto do comando.
 * @returns {object} - Informações do grupo.
 */
function getGroupInfo(ctx) {
  return {
    id: ctx.chat.id.toString(),
    name: ctx.chat.title || 'Grupo sem nome',
    username: ctx.chat.username || null
  };
}

module.exports = {
  readDatabase,
  writeDatabase,
  initializeGroupData,
  isGroupCommand,
  getGroupInfo
};
