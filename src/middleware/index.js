const { Router } = require('express');
const asyncRouter = require('../lib/asyncRouter');

module.exports = () => {
  const routes = asyncRouter(Router());

  // add middleware here

  return routes;
};
