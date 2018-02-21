/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

import { Router } from 'express';
import asyncWrap from 'express-async-wrapper';
import {
  apply,
  register,
  participate,
  exportSafeApplicant,
  isValidMagicToken,
  encodeSession,
} from '../lib/applicants';
import {
  calculateTokensaleStatus,
} from '../lib/status';
import {
  fetchApplicantSession,
} from '../middleware/applicants';

export default ({ config }) => {
  const api = Router();

  api.use(fetchApplicantSession(config));

  // Apply to become a participant
  api.post('/apply', asyncWrap(async (req, res) => {
    const tokensaleStatus = await calculateTokensaleStatus(config.tokensale);
    const rawApplicant = await apply(config, tokensaleStatus, req.body);
    const applicant = exportSafeApplicant(rawApplicant);
    res.json({ result: applicant });
  }));

  // Create session with magic token
  api.post('/sessions', asyncWrap(async (req, res) => {
    const validMagicToken = await isValidMagicToken(req.body.magicToken);
    if (!validMagicToken) throw new Error('Invalid magic token');
    const token = encodeSession(config.jwt.secret, req.body.magicToken);
    res.json({ result: { token } });
  }));

  // Get session
  api.get('/sessions', (req, res) => {
    res.json({ result: req.applicant });
  });

  // Finalize registration for applicant
  api.post('/register', asyncWrap(async (req, res) => {
    const tokensaleStatus = await calculateTokensaleStatus(config.tokensale);
    const rawApplicant = await register(tokensaleStatus, req.body.magicToken, req.body);
    const applicant = exportSafeApplicant(rawApplicant);
    res.json({ result: applicant });
  }));

  // Participate in token sale
  api.post('/participate', asyncWrap(async (req, res) => {
    const tokensaleStatus = await calculateTokensaleStatus(config.tokensale);
    const rawApplicant = await participate(tokensaleStatus, req.body.magicToken, req.body);
    const applicant = exportSafeApplicant(rawApplicant);
    res.json({ result: applicant });
  }));


  return api;
};
