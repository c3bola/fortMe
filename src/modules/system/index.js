'use strict';

module.exports = {
  user: [
    { name: 'help', register: require('./commands/help') }
  ],
  admin: [
    { name: 'addAdmin', register: require('./commands/addAdmin') },
    { name: 'botConfig', register: require('./commands/botConfig') },
    { name: 'broadcast', register: require('./commands/broadcast') },
    // { name: 'list', register: require('./commands/list') },
    // { name: 'listAdmins', register: require('./commands/listAdmins') },
    // { name: 'listconfig', register: require('./commands/listconfig') },
    // { name: 'manageGroups', register: require('./commands/manageGroups') },
    // { name: 'manager', register: require('./commands/manager') },
    // { name: 'register', register: require('./commands/register') },
    // { name: 'rm', register: require('./commands/rm') }
  ]
};