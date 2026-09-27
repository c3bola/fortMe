require('dotenv').config();
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Substitui a API key do config.json pela variável de ambiente
config.apiKey = process.env.TELEGRAM_API_KEY;

module.exports = config;
