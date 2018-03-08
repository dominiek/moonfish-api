const Router = require('koa-router');

const { calculateStatus } = require('../lib/sale-status');
const { fetchSession } = require('../middlewares/applicants');

const {
  apply,
  register,
  participate,
  exportSafeApplicant,
  isValidMagicToken,
  encodeSession,
  getApplicantByMagicToken,
} = require('../lib/applicants');

const router = new Router();
router
  .use(fetchSession)
  .post('/apply', async (ctx) => { // Apply to become a participant
    const tokenSaleStatus = await calculateStatus();
    const rawApplicant = await apply(tokenSaleStatus, ctx.request.body);
    const { mnemonicPhrase } = rawApplicant;
    const applicant = exportSafeApplicant(rawApplicant);
    applicant.mnemonicPhrase = mnemonicPhrase;
    ctx.body = { data: applicant };
  })
  .post('/sessions', async (ctx) => { // Create session with magic token
    const { magicToken } = ctx.request.body;
    const validMagicToken = await isValidMagicToken(magicToken);
    if (!validMagicToken) ctx.throw('Invalid magic token', 401);
    const rawApplicant = await getApplicantByMagicToken(magicToken);
    const token = encodeSession(magicToken);
    const applicant = exportSafeApplicant(rawApplicant);
    ctx.body = { data: { token, applicant } };
  })
  .get('/sessions', (ctx) => { // Get session
    if (!ctx.state.applicant) ctx.throw('Authentication required', 401);
    ctx.body = { data: exportSafeApplicant(ctx.state.applicant) };
  })
  .post('/register', async (ctx) => { // Finalize registration for applicant
    const { applicant } = ctx.state;
    if (!applicant) ctx.throw('Authentication required', 401);
    const tokensaleStatus = await calculateStatus();
    const rawApplicant = await register(tokensaleStatus, applicant.magicToken, ctx.request.body);
    ctx.body = { data: exportSafeApplicant(rawApplicant) };
  })
  .post('/participate', async (ctx) => { // Participate in token sale
    const { applicant } = ctx.state;
    if (!applicant) ctx.throw('Authentication required', 401);
    const tokensaleStatus = await calculateStatus();
    const rawApplicant = await participate(tokensaleStatus, applicant.magicToken, ctx.request.body);
    ctx.body = { data: exportSafeApplicant(rawApplicant) };
  });

module.exports = router;
