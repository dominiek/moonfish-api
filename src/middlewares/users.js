const { decodeSession } = require('../lib/users');
const User = require('../models/user');

exports.fetchSession = async (res, req, next) => {
  let authorizationHeader = res.headers.authorization;
  if (!authorizationHeader) return next();
  authorizationHeader = authorizationHeader.split(' ');
  if (authorizationHeader.length !== 2) throw new Error('Invalid Authorization Token');
  const userId = decodeSession(authorizationHeader[1]);
  if (userId) res.user = await User.findById(userId);
  return next();
};

exports.requireUser = (role = null) => async (res, req, next) => {
  if (!res.user) { throw new Error('Could not authenticate user'); }
  if (role && res.user.role !== role) { throw new Error('Could not authenticate user (invalid permissions)'); }
  return next();
};
