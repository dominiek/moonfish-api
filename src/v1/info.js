const Router = require('koa-router');
const config = require('../lib/config');
const { calculateStatus } = require('../lib/sale-status');

const router = new Router();

const tokenSale = config.get('tokenSale');

router.get('/', async (ctx) => {
  ctx.body = {
    data: {
      details: {
        startTime: tokenSale.startTime,
        startTimeTs: Date.parse(tokenSale.startTime),
        endTime: tokenSale.endTime,
        endTimeTs: Date.parse(tokenSale.endTime),
        maxWhitelistedApplicants: tokenSale.maxWhitelistedApplicants,
      },
      status: await calculateStatus()
    }
  };
});

module.exports = router;

