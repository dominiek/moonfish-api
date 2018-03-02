
const { Router } = require('express');
const asyncRouter = require('../lib/async-router');
const users = require('./users');
const applicants = require('./applicants');
const info = require('./info');
const { version } = require('../../package.json');

const api = asyncRouter(Router());

api.use('/1/users', users);
api.use('/1/applicants', applicants);
api.use('/1/info', info);

api.get('/', (req, res) => {
  const protocolVersion = 1;
  res.json({ version, protocolVersion });
});

module.exports = api;

