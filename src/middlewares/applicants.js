const { decodeSession } = require('../lib/applicants');
const Applicant = require('../models/applicant');

exports.fetchSession = async (res, req, next) => {
  let authorizationHeader = res.headers.authorization;
  if (!authorizationHeader) return next();
  authorizationHeader = authorizationHeader.split(' ');
  if (authorizationHeader.length !== 2) throw new Error('Invalid Authorization Token');
  const magicToken = decodeSession(authorizationHeader[1]);
  if (magicToken) res.applicant = await Applicant.findOne({ magicToken });
  return next();
};