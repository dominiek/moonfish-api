const Router = require('koa-router');
const database = require('./database');
const setupFixtures = require('../scripts/setup-fixtures');
const { version } = require('../package.json');
const { initialize: initializeEmails } = require('./lib/emails');
const app = require('./app');
const config = require('./config');
// const v1 = require('./v1');

const PORT = config.get('bind.port');
const HOST = config.get('bind.host');

const router = new Router();
router.get('/', (ctx) => { ctx.body = { version }; });
// router.use('/1', v1.routes());

module.exports = (async () => {
  await initializeEmails();

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.router = router;

  if (process.env.NODE_ENV !== 'test') {
    await database();
    await setupFixtures();

    console.log('list');
    app.listen(PORT, HOST, () => {
      console.log(`Started on port //${HOST}:${PORT}`);
    });
  }

  return app;
})();