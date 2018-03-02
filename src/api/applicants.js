const { Router } = require('express');
const asyncRouter = require('../lib/async-router');

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

const api = asyncRouter(Router());

api.use(fetchSession);

// Apply to become a participant
api.post('/apply', async (req, res) => {
  const tokenSaleStatus = await calculateStatus();
  const rawApplicant = await apply(tokenSaleStatus, req.body);
  const applicant = exportSafeApplicant(rawApplicant);
  res.json({ result: applicant });
});

// Create session with magic token
api.post('/sessions', async (req, res) => {
  const validMagicToken = await isValidMagicToken(req.body.magicToken);
  if (!validMagicToken) throw new Error('Invalid magic token');
  const rawApplicant = await getApplicantByMagicToken(req.body.magicToken);
  const token = encodeSession(req.body.magicToken);
  const applicant = exportSafeApplicant(rawApplicant);
  res.json({ result: { token, applicant } });
});

// Get session
api.get('/sessions', (req, res) => {
  if (!req.applicant) throw new Error('Authentication required');
  res.json({ result: exportSafeApplicant(req.applicant) });
});

// Finalize registration for applicant
api.post('/register', async (req, res) => {
  if (!req.applicant) throw new Error('Authentication required');
  const tokensaleStatus = await calculateStatus();
  const rawApplicant = await register(tokensaleStatus, req.applicant.magicToken, req.body);
  const applicant = exportSafeApplicant(rawApplicant);
  res.json({ result: applicant });
});

// Participate in token sale
api.post('/participate', async (req, res) => {
  if (!req.applicant) throw new Error('Authentication required');
  const tokensaleStatus = await calculateStatus();
  const rawApplicant = await participate(tokensaleStatus, req.applicant.magicToken, req.body);
  const applicant = exportSafeApplicant(rawApplicant);
  res.json({ result: applicant });
});

module.exports = api;