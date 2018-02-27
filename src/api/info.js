

const { Router } = require('express');
const asyncRouter = require('../lib/asyncRouter');

const {
  calculateTokensaleStatus,
} = require('../lib/status');

module.exports = ({ config }) => {
  const api = asyncRouter(Router());

  api.get('/', async (req, res) => {
    const details = {
      startTime: config.tokensale.startTime,
      startTimeTs: Date.parse(config.tokensale.startTime),
      endTime: config.tokensale.endTime,
      endTimeTs: Date.parse(config.tokensale.endTime),
      maxWhitelistedApplicants: config.tokensale.maxWhitelistedApplicants,
    };
    const status = await calculateTokensaleStatus(config.tokensale);
    res.json({ result: { details, status } });
  });

  return api;
};
