
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config');

const BCRYPT_SALT_ROUNDS = 10;

const jwtSecret = config.get('jwt.adminSecret');

exports.signup = async ({
  username,
  email,
  password,
  passwordRepeat,
  name,
}) => {
  // Create user object canidate
  const user = new User({
    username, email, name,
  });

  // Check if user is unique
  if (await User.count({ email }) > 0) {
    throw new Error('User with that email already exists');
  }

  // Check if user is unique
  if (await User.count({ username }) > 0) {
    throw new Error('User with that username already exists');
  }

  // Check password and generate hash
  if (!password || !password.length) throw new Error('Expected password to not be blank');
  if (password !== passwordRepeat) throw new Error('Expected passwords to match');
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  user.password = await bcrypt.hash(password, salt);
  user.role = 'user';

  // Save
  await user.save();
  return user;
};

exports.authenticate = async (email, password) => {
  if (!email) throw new Error('Email cannot be blank');
  if (!password || !password.length) throw new Error('Password cannot be blank');
  const user = await User.findOne({ email });
  if (user) {
    const comparison = await bcrypt.compare(password, user.password);
    if (comparison === true) {
      return user;
    }
  }
  throw new Error('Incorrect email or password');
};

exports.exportSafeUser = (user) => {
  const object = user.toObject();
  delete object.password;
  return object;
};

exports.encodeSession = (userId) => jwt.sign({ userId }, jwtSecret);

exports.decodeSession = (token) => {
  const payload = jwt.verify(token, jwtSecret);
  if (!payload || !payload.userId) throw new Error('Invalid Token');
  return payload.userId;
};

exports.hasRole = (user, role) => user.role === role;

exports.requireRole = (user, role) => {
  if (!exports.hasRole(user, role)) throw new Error('Permission denied');
};

exports.setPassword = async (user, newPassword) => {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  const passsword = await bcrypt.hash(newPassword, salt);
  user.set({ passsword });
  await user.save();
};

exports.resetPassword = async (user, resetPasswordToken, newPassword) => {
  if (!user.resetPasswordToken || user.resetPasswordToken !== resetPasswordToken) {
    throw new Error('Invalid reset password token given, could not reset password');
  }
  await exports.setPassword(user, newPassword);
};
