
const { decodeSession } = require('../lib/applicants');
const Applicant = require('../models/applicant');

exports.fetchApplicantSession = config => async (res, req, next) => {
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
};

exports.requireApplicant = () => async (res, req, next) => {
  if (!res.applicant) { throw new Error('Could not authenticate applicant'); }
  return next();
};
