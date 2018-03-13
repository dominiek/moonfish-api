const nodeEnvConfiguration = require('node-env-configuration');
const configDefaults = require('../../config/defaults.json');
const { get, set, cloneDeep } = require('lodash');

const ensureNoDefaults = (config) => {
  Object.keys(config).forEach((key) => {
    if (config[key] === '[change me]') {
      throw new Error(`Refusing to run with configuration default: ${key} = ${config[key]}`);
    }
    Object.keys(config[key]).forEach((subKey) => {
      if (config[key][subKey] === '[change me]') {
        throw new Error(`Refusing to run with configuration default: ${key}[${subKey}] = ${config[key][subKey]}`);
      }
    });
  });
};

const defaultConfig = nodeEnvConfiguration({
  defaults: configDefaults,
  prefix: 'moonfish',
});

if (process.env.NODE_ENV !== 'dev' && process.env.NODE_ENV !== 'test') {
  ensureNoDefaults(defaultConfig);
}

const testMethods = {};

const refs = { config: { ...defaultConfig } };
if (process.env.NODE_ENV === 'test') {
  testMethods.__set = (path, value, merge) => {
    const newValue = merge ? { ...get(refs.config, path), ...value } : value;
    set(refs.config, path, newValue);
    return this;
  };
  testMethods.__restore = () => {
    refs.config = cloneDeep(defaultConfig);
    return this;
  };
  testMethods.__getAll = () => {
    return refs.config;
  };
}

module.exports = {
  ...testMethods,
  get: (path, doThrow = true) => {
    const result = get(refs.config, path);
    if (doThrow && typeof result === 'undefined') {
      throw Error(`config.get(${path}) is not set in the configuration`);
    }
    return result;
  }
};
