const nodeEnvConfiguration = require('node-env-configuration');
const configDefaults = require('../config/defaults.json');

const ensureNoDefaults = (config) => {
  Object.keys(config).forEach((key) => {
    if (config[key] === 'changeme') {
      throw new Error(`Refusing to run with configuration default: ${key} = ${config[key]}`);
    }
    Object.keys(config[key]).forEach((subKey) => {
      if (config[key][subKey] === 'changeme') {
        throw new Error(`Refusing to run with configuration default: ${key} = ${config[key][subKey]}`);
      }
    });
  });
};

const config = nodeEnvConfiguration({
  defaults: configDefaults,
  prefix: 'api',
});

if (process.env.NODE_ENV !== 'dev' && process.env.NODE_ENV !== 'test') {
  ensureNoDefaults(config);
}

module.exports = config;
