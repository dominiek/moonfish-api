const { signup } = require('../src/lib/users');
const User = require('../src/models/user');
const config = require('../src/lib/config');

const admin = config.get('admin');
const adminPassword = config.get('admin.password');

const createUsers = async () => {
  const params = Object.assign({}, admin, { passwordRepeat: adminPassword });
  if (await User.findOne({ email: params.email })) {
    return false;
  }
  const adminUser = await signup(params);
  adminUser.role = 'admin';
  await adminUser.save();
  console.log(`Added admin user ${adminUser.email} to database`);
  return true;
};

module.exports = createUsers;