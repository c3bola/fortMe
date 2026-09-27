const mysql = require('mysql2/promise');
require('dotenv').config();

// ============================================================================
// CONEXÃO PRIMÁRIA: Banco Principal do Bot
// ============================================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'fnbr_community',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '-03:00',
  connectTimeout: 10000,
  // acquireTimeout foi removido para evitar o warning na inicialização do mysql2
  multipleStatements: false,
});

// ============================================================================
// CONEXÃO SECUNDÁRIA: Banco do Bot de Sorteios (Assinaturas VIP)
// ============================================================================
const sorteiosPool = mysql.createPool({
  host: process.env.SORTEIOS_DB_HOST || 'localhost',
  user: process.env.SORTEIOS_DB_USER || 'sorteiobot',
  password: process.env.SORTEIOS_DB_PASSWORD || 'Xv9!rT&2qL@ePz7$',
  database: process.env.SORTEIOS_DB_NAME || 'fnbr_sorteios',
  port: process.env.SORTEIOS_DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

async function testConnection() {
  // 1. Testa a conexão PRINCIPAL (Falha Crítica se não conectar)
  try {
    const connection = await pool.getConnection();
    console.log('[DB] ✓ Conexão com MySQL (Principal) estabelecida com sucesso');
    connection.release();
  } catch (error) {
    console.error('[DB] ✗ Erro CRÍTICO ao conectar com MySQL Principal:', error.message);
    return false; // Retorna false para interromper o bot
  }

  // 2. Testa a conexão de SORTEIOS/VIP (Soft Fail - Não derruba o bot)
  try {
    const sorteiosConnection = await sorteiosPool.getConnection();
    console.log('[DB] ✓ Conexão com MySQL (Sorteios/VIP) estabelecida com sucesso');
    sorteiosConnection.release();
  } catch (error) {
    console.warn('[DB] ⚠️ Aviso: Não foi possível conectar ao banco de Sorteios (VIP). O bot iniciará, mas validações VIP falharão. Erro:', error.message);
    // Não retorna false aqui. Permite que o fluxo continue.
  }

  return true;
}

async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('[DB] Erro ao executar query:', error.message);
    throw error;
  }
}

async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('[DB] Transação revertida devido a erro:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

async function closePool() {
  try {
    await pool.end();
    await sorteiosPool.end();
    console.log('[DB] ✓ Pools de conexões encerrados graciosamente');
  } catch (error) {
    console.error('[DB] Erro ao fechar pools:', error.message);
  }
}

module.exports = {
  pool,
  sorteiosPool,
  query,
  transaction,
  testConnection,
  closePool
};