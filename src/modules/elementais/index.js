'use strict';

module.exports = {
  user: [
    { name: 'elementais', aliases: ['sprites'], register: require('./commands/elementais') },
    { name: 'sprite', register: require('./commands/sprite') },
    { name: 'colecao', register: require('./commands/colecao') },
    { name: 'faltam', register: require('./commands/faltam') },
    { name: 'estatisticas', register: require('./commands/estatisticas') },
    { name: 'perfil', register: require('./commands/perfil') },
    { name: 'configsprites', register: require('./commands/configsprites') },
    { name: 'guardioes', register: require('./commands/guardioes') },
    { name: 'diario', register: require('./commands/diario') },
    { name: 'agradecer', register: require('./commands/agradecer') },
    { name: 'ajuda', register: require('./commands/ajuda') },
    { name: 'comparar', register: require('./commands/comparar') },
    { name: 'addcapa', register: require('./commands/addCapa') }, // Removida a duplicação do addcapa
    { name: 'jardim', aliases: ['garden'], register: require('./commands/jardim') }
  ],
  admin: [
    { name: 'configElemental', register: require('./commands/configElemental') },
    { name: 'addtemporada', register: require('./commands/addTemporada') },
    { name: 'buildcards', register: require('./commands/buildCards') },
    { name: 'addelemental', register: require('./commands/addElemental') },
    { name: 'addcapaglobal', register: require('./commands/addCapa') },
    { name: 'configmosaico', register: require('./commands/configMosaico') },
  ]
};