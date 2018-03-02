const database = require('./database');
const setupFixtures = require('../scripts/setup-fixtures');

const { initialize: initializeEmails } = require('./lib/emails');
const server = require('./server');
const config = require('./config');
const api = require('./api');

const errorHandler = require('./middlewares/error-handler');

const PORT = config.get('bind.port');
const HOST = config.get('bind.host');

(async () => {
  await database();
  await initializeEmails();
  await setupFixtures();

  server.use('/', api);
  server.use(errorHandler);

  server.listen(PORT, HOST, () => {
    console.log(`Started on port //${HOST}:${PORT}`);
  });
})();