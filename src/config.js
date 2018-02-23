
import nodeEnvConfiguration from 'node-env-configuration';
import configDefaults from '../config/defaults.json';

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

if (process.env.NODE_ENV !== 'dev') {
  ensureNoDefaults(config);
}

export default config;
