const Router = require('koa-router');

const { calculateStatus } = require('../lib/sale-status');
const authenticate = require('../middlewares/authenticate');
const Applicant = require('../models/applicant');
const { createApplicantToken } = require('../lib/tokens');
const Joi = require('joi');
const validate = require('../middlewares/validate');

const {
  apply,
  register,
  participate,
  exportSafeApplicant,
} = require('../lib/applicants');

const fetchApplicant = async (ctx, next) => {
  ctx.state.applicant = await Applicant.findById(ctx.state.jwt.applicant);
  if (!ctx.state.applicant) ctx.throw(500, 'user associsated to token could not not be found');
  await next();
};

const router = new Router();
router
  .post(
    '/apply',
    validate({ body: { token: Joi.string().required() } }),
    async (ctx) => { // Apply to become a participant
      const tokenSaleStatus = await calculateStatus();
      const applicant = await apply(tokenSaleStatus, ctx.request.body);
      ctx.body = {
        data: {
          ...exportSafeApplicant(applicant),
          mnemonicPhrase: applicant.mnemonicPhrase,
        }
      };
    }
  );

router
  .post(
    '/sessions',
    validate({ body: { token: Joi.string().required() } }),
    authenticate({ type: 'applicant:temporary' }, { getToken: (ctx) => ctx.request.body.token }),
    fetchApplicant,
    async (ctx) => {
      ctx.body = {
        data: {
          token: createApplicantToken(ctx.state.applicant),
          applicant: exportSafeApplicant(ctx.state.applicant),
        }
      };
    }
  );

router
  .use(authenticate({ type: 'applicant' }))
  .use(fetchApplicant)
  .get('/sessions', (ctx) => { // Get session
    ctx.body = { data: exportSafeApplicant(ctx.state.applicant) };
  })
  .post('/register', async (ctx) => { // Finalize registration for applicant
    const { applicant } = ctx.state;
    const tokensaleStatus = await calculateStatus();
    const rawApplicant = await register(tokensaleStatus, applicant, ctx.request.body);
    ctx.body = { data: exportSafeApplicant(rawApplicant) };
  })
  .post('/participate', async (ctx) => { // Participate in token sale
    const { applicant } = ctx.state;
    const tokensaleStatus = await calculateStatus();
    const rawApplicant = await participate(tokensaleStatus, applicant, ctx.request.body);
    ctx.body = { data: exportSafeApplicant(rawApplicant) };
  });

module.exports = router;
