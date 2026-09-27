'use strict';

module.exports = {
  user: [
    { name: 'tryhardme', register: require('./commands/tryhardme') },
    { name: 'x1', register: require('./commands/x1') },
    { name: 'x1stats', register: require('./commands/x1stats') }
  ],
  admin: [
    { name: 'registerTryhardImage', register: require('./commands/registerTryhardImage') }
  ]
};