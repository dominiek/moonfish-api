const mongoose = require('mongoose');
const { signup, encodeSession } = require('./users');

exports.setupMongooseDb = () => new Promise((resolve) => {
  mongoose.connect('mongodb://localhost/skeleton_test');
  mongoose.connection.once('open', () => {
    resolve();
  });
});

exports.teardownMongooseDb = () => new Promise((resolve) => {
  mongoose.connection.close();
  resolve();
});

exports.createTestUserWithSession = async (jwtSecret, id, role = 'user') => {
  const user = await signup({
    username: id,
    email: `${id}@me.com`,
    password: 'password',
    passwordRepeat: 'password',
  });
  user.role = role;
  await user.save();
  return [user, encodeSession(jwtSecret, user._id)]; // eslint-disable-line
};

exports.generateSessionHeader = token => ['Authorization', `Bearer ${token}`];
