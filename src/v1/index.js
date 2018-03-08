
const Router = require('koa-router');
const users = require('./users');
const applicants = require('./applicants');
const info = require('./info');

const router = new Router();

router.use('/users', users.routes());
router.use('/applicants', applicants.routes());
router.use('/info', info.routes());

module.exports = router;

