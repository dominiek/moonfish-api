
const Router = require('koa-router');

const {
  fetchSession,
  requireUser,
} = require('../middlewares/users');

const {
  signup,
  authenticate,
  encodeSession,
  exportSafeUser,
} = require('../lib/users');

const User = require('../models/user');

const router = new Router();

router.use(fetchSession)
  .post('/', async (ctx) => {
    const rawUser = await signup(ctx.request.body);
    ctx.body = { data: exportSafeUser(rawUser) };
  })
  .post('/sessions', async (ctx) => {
    const { email, password } = ctx.request.body;
    const rawUser = await authenticate(email, password);
    const token = encodeSession(rawUser._id); //eslint-disable-line
    const user = exportSafeUser(rawUser);
    ctx.body = { data: { user, token } };
  });

router
  .use(requireUser())
  .get('/self', (ctx) => { // Get self (user info)
    const user = exportSafeUser(ctx.state.user);
    ctx.body = { data: user };
  })
  .post('/self', async (ctx) => { // Update self (user profile)
    const { body } = ctx.request;
    ['name'].forEach((validField) => {
      if (body[validField]) {
        ctx.state.user.set('name', body[validField]);
      }
    });
    await ctx.state.user.save();
    ctx.body = { data: exportSafeUser(ctx.state.user) };
  })
  .delete('/self', async (ctx) => {
    const { user } = ctx.state;
    await user.remove();
    ctx.body = { data: { success: true } };
  });

router
  .use(requireUser('admin'))
  .get('/:id', async (ctx) => {
    const rawUser = await User.findById(ctx.params.id);
    const user = exportSafeUser(rawUser);
    ctx.body = { data: user };
  })
  .delete('/:id', async (ctx) => {
    const user = await User.findById(ctx.params.id);
    if (!user) throw new Error('No such user');
    await user.remove();
    ctx.body = { data: { success: true } };
  })
  .post('/:id', async (ctx) => {
    const rawUser = await User.findById(ctx.params.id);
    if (!rawUser) throw new Error('No such user');
    rawUser.set(ctx.request.body);
    await rawUser.save();
    const user = exportSafeUser(rawUser);
    ctx.body = { data: user };
  });

module.exports = router;