
const { Router } = require('express');
const asyncRouter = require('../lib/asyncRouter');
const users = require('./users');
const applicants = require('./applicants');
const info = require('./info');
const { version } = require('../../package.json');

module.exports = ({ config, db }) => {
  const api = asyncRouter(Router());

  api.use('/1/users', users({ config, db }));
  api.use('/1/applicants', applicants({ config, db }));
  api.use('/1/info', info({ config }));

  api.get('/', (req, res) => {
    const protocolVersion = 1;
    res.json({ version, protocolVersion });
  });

  return api;
};
