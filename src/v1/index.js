
const Router = require('koa-router');
const users = require('./users');
const applicants = require('./applicants');
const status = require('./status');

const router = new Router();

router.use('/users', users.routes());
router.use('/applicants', applicants.routes());
router.use('/status', status.routes());

module.exports = router;

