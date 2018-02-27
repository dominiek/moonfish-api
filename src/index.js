
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const initializeDb = require('./db');
const middleware = require('./middleware');
const api = require('./api');
const setupFixtures = require('./lib/setupFixtures');
const config = require('./config');


const app = express();
app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.corsHeaders,
}));

app.use(bodyParser.json({
  limit: config.bodyLimit,
}));

const jsonErrorHandler = (err, req, res, next) => {
  // console.error(err.stack)
  if (!err) return next();
  return res.json({
    error: {
      message: err.message,
    },
  });
};

const initApp = async () => {
  const db = await initializeDb({ config });
  await setupFixtures();
  app.use(middleware({ config, db }));
  app.use('/', api({ config, db }));
  app.use(jsonErrorHandler);
  return app;
};

const bindApp = async (appToBind) => {
  appToBind.server.listen(config.bind.port, config.bind.host, () => {
    console.log(`Started on port ${appToBind.server.address().port}`);
  });
};

module.exports = {
  initApp,
  app,
  bindApp,
  jsonErrorHandler,
};
