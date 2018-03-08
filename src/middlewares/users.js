const { decodeSession } = require('../lib/users');
const User = require('../models/user');


exports.fetchSession = async (ctx, next) => {
  const authorizationHeader = ctx.headers.authorization;
  if (!authorizationHeader) return next();
  const authorizationHeaders = authorizationHeader.split(' ');
  if (authorizationHeaders.length !== 2) ctx.throw('Invalid Authorization Token', 401);
  const userId = decodeSession(authorizationHeaders[1]);
  if (userId) ctx.state.user = await User.findById(userId);
  return next();
};

exports.requireUser = (role = null) => async (ctx, next) => {
  const { user } = ctx.state;
  if (!user) ctx.throw('Could not authenticate user', 401);
  if (role && user.role !== role) ctx.throw('Could not authenticate user (invalid permissions)', 401);
  return next();
};
