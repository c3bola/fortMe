'use strict';

module.exports = {
  user: [
    { name: 'fortgirl', register: require('./commands/fortgirl') },
    { name: 'fortme', register: require('./commands/fortme') },
    { name: 'jonesyme', register: require('./commands/jonesyme') }
  ],
  admin: [
    // { name: 'manageFortGirls', register: require('./commands/manageFortGirls') },
    // { name: 'manageJonesy', register: require('./commands/manageJonesy') },
    // { name: 'managerJonesy', register: require('./commands/managerJonesy') },
    // { name: 'registerFortGirl', register: require('./commands/registerFortGirl') },
    // { name: 'registerFortJonesy', register: require('./commands/registerFortJonesy') },
    // { name: 'registerFortMe', register: require('./commands/registerFortMe') }
  ]
};