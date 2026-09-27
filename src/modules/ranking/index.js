'use strict';

module.exports = {
  user: [
    { name: 'ranking', register: require('./commands/ranking') }
  ],
  admin: [
    { name: 'sendRank', register: require('./commands/sendRank') }
  ]
};