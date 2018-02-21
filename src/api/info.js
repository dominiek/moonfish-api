
import asyncWrap from 'express-async-wrapper';
import { Router } from 'express';
import {
  calculateTokensaleStatus,
} from '../lib/status';

export default ({ config }) => {
  const api = Router();

  api.get('/', asyncWrap(async (req, res) => {
    const info = {
      startTime: config.tokensale.startTime,
      startTimeTs: Date.parse(config.tokensale.startTime),
      endTime: config.tokensale.endTime,
      endTimeTs: Date.parse(config.tokensale.endTime),
      maxWhitelistedApplicants: config.tokensale.maxWhitelistedApplicants,
    };
    const status = await calculateTokensaleStatus(config.tokensale);
    res.json({ result: { info, status } });
  }));

  return api;
};
