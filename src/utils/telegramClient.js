const { Telegram } = require('telegraf');
const config = require('../config/config');

module.exports = new Telegram(config.apiKey);