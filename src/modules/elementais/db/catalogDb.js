'use strict';

const categoryDb = require('./catalog/categoryDb');
const spriteDb = require('./catalog/spriteDb');
const variantDb = require('./catalog/variantDb');

module.exports = {
  ...categoryDb,
  ...spriteDb,
  ...variantDb
};