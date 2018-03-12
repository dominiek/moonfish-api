const { decodeToken } = require('../lib/tokens');

function getToken(ctx) {
  let token;
  const parts = (ctx.request.get('authorization') || '').split(' ');
  if (parts.length === 2) {
    const [scheme, credentials] = parts;
    if (/^Bearer$/i.test(scheme)) token = credentials;
  }
  return token;
}

module.exports = ({ type }, options = {}) => {
  return async (ctx, next) => {
    const token = options.getToken ? options.getToken(ctx) : getToken(ctx);
    if (!token) ctx.throw(400, 'No jwt token found');
    const jwt = decodeToken(token);
    if (!jwt) ctx.throw(500, 'Failed to decode jwt token');
    if (type && jwt.type !== type) {
      ctx.throw(400, `Wrong type of jwt token, expected "${type}"'`);
    }
    ctx.state.jwt = jwt;
    return next();
  };
};
