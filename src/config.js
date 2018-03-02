const nodeEnvConfiguration = require('node-env-configuration');
const configDefaults = require('../config/defaults.json');

const { get } = require('./lib/utils');

const ensureNoDefaults = (config) => {
  Object.keys(config).forEach((key) => {
    if (config[key] === '[change me]') {
      throw new Error(`Refusing to run with configuration default: ${key} = ${config[key]}`);
    }
    Object.keys(config[key]).forEach((subKey) => {
      if (config[key][subKey] === '[change me]') {
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

const testMethods = {};

if (process.env.NODE_ENV === 'test') {
  testMethods.setTestConfig = (testConfig) => {
    Object.assign(config, testConfig);
  };
}

module.exports = {
  ...testMethods,
  get: (path, doThrow = true) => {
    const result = get(config, path);
    if (doThrow && typeof result === 'undefined') {
      throw Error(`config.get(${path}) is not set in the configuration`);
    }
    return result;
  }
};
