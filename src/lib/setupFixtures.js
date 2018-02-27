const nodeEnvConfiguration = require('node-env-configuration');
const { signup } = require('./users');
const configDefaults = require('../../config/defaults.json');
const User = require('../models/user');

const config = nodeEnvConfiguration({
  defaults: configDefaults,
  prefix: 'api',
});

const createUsers = async () => {
  const { admin } = config;
  const params = Object.assign({}, admin, { passwordRepeat: admin.password });
  if (await User.findOne({ email: params.email })) {
    return false;
  }
  const adminUser = await signup(params);
  adminUser.role = 'admin';
  await adminUser.save();
  console.log(`Added admin user ${adminUser.email} to database`);
  return true;
};

module.exports = async () => {
  await createUsers();
};
