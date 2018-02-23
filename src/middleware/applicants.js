
import asyncWrap from 'express-async-wrapper';
import {
  decodeSession,
  exportSafeApplicant,
} from '../lib/applicants';
import Applicant from '../models/applicant';

export const fetchApplicantSession = config => asyncWrap(async (res, req, next) => {
  let authorizationHeader = res.headers.authorization;
  if (!authorizationHeader) return next();
  authorizationHeader = authorizationHeader.split(' ');
  if (authorizationHeader.length !== 2) throw new Error('Invalid Authorization Token');
  const magicToken = decodeSession(config.jwt.secret, authorizationHeader[1]);
  if (magicToken) {
    const rawApplicant = await Applicant.findOne({ magicToken });
    res.applicant = rawApplicant;
  }
  return next();
});

export const requireApplicant = () => asyncWrap(async (res, req, next) => {
  if (!res.applicant) { throw new Error('Could not authenticate applicant'); }
  return next();
});
