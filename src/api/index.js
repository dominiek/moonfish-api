
import { Router } from 'express';
import users from './users';
import applicants from './applicants';
import info from './info';
import { version } from '../../package.json';

export default ({ config, db }) => {
  const api = Router();

  api.use('/1/users', users({ config, db }));
  api.use('/1/applicants', applicants({ config, db }));
  api.use('/1/info', info({ config }));

  api.get('/', (req, res) => {
    const protocolVersion = 1;
    res.json({ version, protocolVersion });
  });

  return api;
};
