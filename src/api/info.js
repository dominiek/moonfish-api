
import { Router } from 'express';

export default ({ config }) => {
  const api = Router();

  api.get('/details', (req, res) => {
    const result = {
      deadlineString: config.tokensale.deadline,
      deadlineTs: Date.parse(config.tokensale.deadline),
      maxWhitelistedMembers: config.tokensale.maxWhitelistedMembers,
    };
    res.json({ result });
  });

  return api;
};
