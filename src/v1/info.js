const Router = require('koa-router');
const config = require('../lib/config');
const { calculateStatus } = require('../lib/sale-status');

const router = new Router();

router.get('/', async (ctx) => {
  const tokenSale = config.get('tokenSale');
  ctx.body = {
    data: {
      ...tokenSale,
      startTS: Date.parse(tokenSale.startTime),
      endTS: Date.parse(tokenSale.endTime),
      ...(await calculateStatus())
    }
  };
});

module.exports = router;

