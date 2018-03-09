const Router = require('koa-router');

const { calculateStatus } = require('../lib/sale-status');
const { requireApplicant } = require('../middlewares/applicants');
const validate = require('../middlewares/validate');
const Joi = require('joi');

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
  .post('/apply', validate({ body: { email: Joi.string().email().required() } }), async (ctx) => { // Apply to become a participant
    const status = await calculateStatus();
    if (!status.acceptApplicants) {
      ctx.throw('Token sale is not accepting applicants currently', 409);
    }
    const rawApplicant = await apply(ctx.request.body);
    const { mnemonicPhrase } = rawApplicant;
    const applicant = exportSafeApplicant(rawApplicant);
    applicant.mnemonicPhrase = mnemonicPhrase;
    ctx.body = { data: applicant };
  })
  .post('/sessions', validate({ body: { magicToken: Joi.string().required() } }), async (ctx) => { // Create session with magic token
    const { magicToken } = ctx.request.body;
    const validMagicToken = await isValidMagicToken(magicToken);
    if (!validMagicToken) ctx.throw('Invalid magic token', 401);
    const rawApplicant = await getApplicantByMagicToken(magicToken);
    const token = encodeSession(magicToken);
    const applicant = exportSafeApplicant(rawApplicant);
    ctx.body = { data: { token, applicant } };
  })
  .use(requireApplicant)
  .get('/sessions', (ctx) => { // Get session
    ctx.body = { data: exportSafeApplicant(ctx.state.applicant) };
  })
  .post('/register', validate({ body: { magicToken: Joi.string().required() } }), async (ctx) => { // Finalize registration for applicant
    const tokensaleStatus = await calculateStatus();
    if (!tokensaleStatus.acceptApplicants) {
      ctx.throw('Token sale is not accepting applicants currently', 409);
    }
    const rawApplicant = await register(ctx.state.applicant.magicToken, ctx.request.body);
    ctx.body = { data: exportSafeApplicant(rawApplicant) };
  })
  .post('/participate', async (ctx) => { // Participate in token sale
    const tokensaleStatus = await calculateStatus();
    if (!tokensaleStatus.acceptParticipation) {
      ctx.throw('Token sale is currently closed', 409);
    }
    const rawApplicant = await participate(ctx.state.applicant.magicToken, ctx.request.body);
    ctx.body = { data: exportSafeApplicant(rawApplicant) };
  });

module.exports = router;
