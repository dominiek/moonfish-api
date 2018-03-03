const Koa = require('koa');
const cors = require('@koa/cors');

const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const errorHandler = require('./middlewares/error-handler');

const config = require('./config');

const app = new Koa();

app.use(errorHandler)
  .use(logger())
  .use(cors({
    exposedHeaders: config.get('cors'),
  }))
  .use(bodyParser());

app.on('error', (err) => {
  console.error(err.stack);
});

module.exports = app;