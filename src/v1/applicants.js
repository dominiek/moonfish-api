const Router = require('koa-router');

const { calculateStatus } = require('../lib/sale-status');
const config = require('../lib/config');
const { sendWelcome } = require('../lib/emails');
const authenticate = require('../middlewares/authenticate');
const Applicant = require('../models/applicant');
const { createApplicantToken, createApplicantTemporaryToken } = require('../lib/tokens');
const Joi = require('joi');
const validate = require('../middlewares/validate');

const fetchApplicant = async (ctx, next) => {
  ctx.state.applicant = await Applicant.findById(ctx.state.jwt.applicantId);
  if (!ctx.state.applicant) ctx.throw(500, 'user associsated to token could not not be found');
  await next();
};

const router = new Router();
router
  .post(
    '/apply',
    validate({ body: { email: Joi.string().email().lowercase().required() } }),
    async (ctx) => {
      const { email } = ctx.request.body;
      const { acceptApplicants } = await calculateStatus();
      if (!acceptApplicants) {
        ctx.throw(423, 'Token sale is not accepting applicants currently');
      }

      let applicant = await Applicant.findOne({ email });
      if (!applicant) {
        applicant = await Applicant.create({ email });
      }

      await sendWelcome(email, {
        token: createApplicantTemporaryToken(applicant),
        mnemonicPhrase: applicant.mnemonicPhrase
      });

      ctx.status = 204;
    }
  );

router
  .post(
    '/authenticate',
    validate({ body: { token: Joi.string().required() } }),
    authenticate({ type: 'applicant:temporary' }, { getToken: (ctx) => ctx.request.body.token }),
    fetchApplicant,
    async (ctx) => {
      ctx.body = {
        data: {
          token: createApplicantToken(ctx.state.applicant)
        }
      };
    }
  );

router
  .use(authenticate({ type: 'applicant' }))
  .use(fetchApplicant)
  .get('/me', (ctx) => { // Get session
    ctx.body = { data: ctx.state.applicant.toResource() };
  })
  .post(
    '/register',
    validate({
      body: {
        firstName: Joi.string().required().min(1),
        lastName: Joi.string().required().min(1),
        ethAmount: Joi.number().positive().required()
      }
    }),
    async (ctx) => { // Finalize registration for applicant
      const { applicant } = ctx.state;
      const { acceptApplicants } = await calculateStatus();
      const { firstName, lastName, ethAmount } = ctx.request.body;
      if (!acceptApplicants) {
        ctx.throw(423, 'Token sale is not accepting applicants currently');
      }

      const maxApplicantEthAmount = config.get('tokenSale.maxApplicantEthAmount');
      if (maxApplicantEthAmount && ethAmount > maxApplicantEthAmount) {
        ctx.throw(400, `ethAmount is too high, max amount ${maxApplicantEthAmount}`);
      }

      Object.assign(applicant, {
        firstName,
        lastName,
        ethAmount,
        completedRegistration: true
      });

      await applicant.save();

      ctx.body = { data: applicant.toResource() };
    }
  )
  .post(
    '/participate',
    validate({
      body: {
        ethAddress: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/).required(),
      }
    }),
    async (ctx) => {
      const { applicant } = ctx.state;
      const { acceptParticipation } = await calculateStatus();
      if (!acceptParticipation) {
        ctx.throw(423, 'Token sale is currently closed');
      }

      Object.assign(applicant, {
        ...ctx.request.body,
        isParticipating: true
      });

      await applicant.save();
      ctx.body = { data: applicant.toResource() };
    }
  );

module.exports = router;
