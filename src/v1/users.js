const Router = require('koa-router');
const Joi = require('joi');
const { omit } = require('lodash');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const tokens = require('../lib/tokens');
const { sendAdminInvite } = require('../lib/emails');
const User = require('../models/user');

const router = new Router();

const fetchUser = async (ctx, next) => {
  ctx.state.user = await User.findById(ctx.state.jwt.userId);
  if (!ctx.state.user) ctx.throw(500, 'user associsated to token could not not be found');
  await next();
};

router
  .post(
    '/register',
    validate({
      body: {
        token: Joi.string().required(),
        name: Joi.string().required(),
        username: Joi.string().regex(/^[a-zA-Z0-9_]+$/).min(3).required(),
        password: Joi.string().required()
      }
    }),
    authenticate({ type: 'admin:temporary' }, { getToken: (ctx) => ctx.request.body.token }),
    async (ctx) => {
      const { jwt } = ctx.state;
      if (!jwt || !jwt.email) {
        ctx.throw(500, 'jwt token doesnt contain email');
      }
      const user = await User.create({
        email: jwt.email,
        ...omit(ctx.request.body, ['token'])
      });
      ctx.body = { data: { token: tokens.createAdminToken(user) } };
    }
  )
  .post(
    '/authenticate',
    validate({
      body: {
        email: Joi.string().email().required(),
        password: Joi.string().required()
      }
    }),
    async (ctx) => {
      const { email, password } = ctx.request.body;
      const user = await User.findOne({ email });
      if (!user) {
        ctx.throw(401, 'email password combination does not match');
      }
      const isSame = await user.verifyPassword(password);
      if (!isSame) {
        ctx.throw(401, 'email password combination does not match');
      }
      ctx.body = { data: { token: tokens.createAdminToken(user) } };
    }
  );

router
  .use(authenticate({ type: 'admin' }))
  .use(fetchUser)
  .get('/me', (ctx) => {
    ctx.body = { data: ctx.state.user.toResource() };
  })
  .patch(
    '/me',
    validate({
      body: {
        name: Joi.string().required(),
      }
    }),
    async (ctx) => {
      const { user } = ctx.state;
      Object.assign(user, ctx.request.body);
      await user.save();
      ctx.body = { data: user.toResource() };
    }
  )
  .post(
    '/invite',
    validate({
      body: {
        emails: Joi.array().items(Joi.string()).required()
      }
    }),
    async (ctx) => {
      const { emails } = ctx.request.body;
      await Promise.all(emails.map(async email => {
        const count = await User.count({ email });
        if (count) return;
        await sendAdminInvite(email, { token: tokens.createAdminTemporaryToken(email) });
      }));
      ctx.status = 201;
    }
  );

module.exports = router;