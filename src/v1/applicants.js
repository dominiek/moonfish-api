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

router.use(fetchSession);

// Apply to become a participant
router.post('/apply', async (ctx) => {
  const tokenSaleStatus = await calculateStatus();
  const rawApplicant = await apply(tokenSaleStatus, ctx.request.body);
  const { mnemonicPhrase } = rawApplicant;
  const applicant = exportSafeApplicant(rawApplicant);
  applicant.mnemonicPhrase = mnemonicPhrase;
  ctx.body = { data: applicant };
});

// Create session with magic token
router.post('/sessions', async (ctx) => {
  const { magicToken } = ctx.request.body;
  const validMagicToken = await isValidMagicToken(magicToken);
  if (!validMagicToken) throw new Error('Invalid magic token');
  const rawApplicant = await getApplicantByMagicToken(magicToken);
  const token = encodeSession(magicToken);
  const applicant = exportSafeApplicant(rawApplicant);
  ctx.body = { data: { token, applicant } };
});

// Get session
router.get('/sessions', (ctx) => {
  if (!ctx.state.applicant) throw new Error('Authentication required');
  ctx.body = { data: exportSafeApplicant(ctx.state.applicant) };
});

// Finalize registration for applicant
router.post('/register', async (ctx) => {
  const { applicant } = ctx.state;
  if (!applicant) throw new Error('Authentication required');
  const tokensaleStatus = await calculateStatus();
  const rawApplicant = await register(tokensaleStatus, applicant.magicToken, ctx.request.body);
  ctx.body = { data: exportSafeApplicant(rawApplicant) };
});

// Participate in token sale
router.post('/participate', async (ctx) => {
  const { applicant } = ctx.state;
  if (!applicant) throw new Error('Authentication required');
  const tokensaleStatus = await calculateStatus();
  const rawApplicant = await participate(tokensaleStatus, applicant.magicToken, ctx.request.body);
  ctx.body = { data: exportSafeApplicant(rawApplicant) };
});

module.exports = router;
