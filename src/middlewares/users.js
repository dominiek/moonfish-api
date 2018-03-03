const { decodeSession } = require('../lib/users');
const User = require('../models/user');


exports.fetchSession = async (ctx, next) => {
  const authorizationHeader = ctx.headers.authorization;
  if (!authorizationHeader) return next();
  const authorizationHeaders = authorizationHeader.split(' ');
  if (authorizationHeaders.length !== 2) throw new Error('Invalid Authorization Token');
  const userId = decodeSession(authorizationHeaders[1]);
  if (userId) ctx.state.user = await User.findById(userId);
  return next();
};

exports.requireUser = (role = null) => async (ctx, next) => {
  const { user } = ctx.state;
  if (!user) throw new Error('Could not authenticate user');
  if (role && user.role !== role) throw new Error('Could not authenticate user (invalid permissions)');
  return next();
};
