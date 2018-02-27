/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const { Router } = require('express');
const asyncRouter = require('../lib/asyncRouter');

const {
  apply,
  register,
  participate,
  exportSafeApplicant,
  isValidMagicToken,
  encodeSession,
  getApplicantByMagicToken,
} = require('../lib/applicants');

const {
  calculateTokensaleStatus,
} = require('../lib/status');

const {
  fetchApplicantSession,
} = require('../middleware/applicants');

module.exports = ({ config }) => {
  const api = asyncRouter(Router());

  api.use(fetchApplicantSession(config));

  // Apply to become a participant
  api.post('/apply', async (req, res) => {
    const tokensaleStatus = await calculateTokensaleStatus(config.tokensale);
    const rawApplicant = await apply(config, tokensaleStatus, req.body);
    const applicant = exportSafeApplicant(rawApplicant);
    res.json({ result: applicant });
  });

  // Create session with magic token
  api.post('/sessions', async (req, res) => {
    const validMagicToken = await isValidMagicToken(req.body.magicToken);
    if (!validMagicToken) throw new Error('Invalid magic token');
    const rawApplicant = await getApplicantByMagicToken(req.body.magicToken);
    const token = encodeSession(config.jwt.secret, req.body.magicToken);
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
    const tokensaleStatus = await calculateTokensaleStatus(config.tokensale);
    const rawApplicant = await register(tokensaleStatus, req.applicant.magicToken, req.body);
    const applicant = exportSafeApplicant(rawApplicant);
    res.json({ result: applicant });
  });

  // Participate in token sale
  api.post('/participate', async (req, res) => {
    if (!req.applicant) throw new Error('Authentication required');
    const tokensaleStatus = await calculateTokensaleStatus(config.tokensale);
    const rawApplicant = await participate(tokensaleStatus, req.applicant.magicToken, req.body);
    const applicant = exportSafeApplicant(rawApplicant);
    res.json({ result: applicant });
  });


  return api;
};
