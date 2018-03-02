const mongoose = require('mongoose');
const { signup, encodeSession } = require('./users');

exports.setupDatabase = () => new Promise((resolve) => {
  mongoose.connect('mongodb://localhost/skeleton_test');
  mongoose.connection.once('open', () => {
    resolve();
  });
});

exports.teardownDatabase = () => new Promise((resolve) => {
  mongoose.connection.close();
  resolve();
});

exports.createTestUserWithSession = async (id, role = 'user') => {
  const user = await signup({
    username: id,
    email: `${id}@me.com`,
    password: 'password',
    passwordRepeat: 'password',
  });
  user.role = role;
  await user.save();

  return {
    user,
    token: encodeSession(user._id)
  };
};

exports.generateSessionHeader = token => ['Authorization', `Bearer ${token}`];
