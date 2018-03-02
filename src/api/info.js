

const { Router } = require('express');
const config = require('../config');
const asyncRouter = require('../lib/async-router');
const { calculateStatus } = require('../lib/sale-status');

const api = asyncRouter(Router());

const tokenSale = config.get('tokenSale');

api.get('/', async (req, res) => {
  res.json({
    result: {
      details: {
        startTime: tokenSale.startTime,
        startTimeTs: Date.parse(tokenSale.startTime),
        endTime: tokenSale.endTime,
        endTimeTs: Date.parse(tokenSale.endTime),
        maxWhitelistedApplicants: tokenSale.maxWhitelistedApplicants,
      },
      status: await calculateStatus()
    }
  });
});

module.exports = api;

