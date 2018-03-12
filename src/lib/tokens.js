const jwt = require('jsonwebtoken');

const config = require('../lib/config');

const jwtSecret = config.get('jwt.secret');
const expiresIn = config.get('jwt.expiresIn');

exports.createApplicantTemporaryToken = (applicant) => {
  return jwt.sign({
    applicant: applicant._id,
    type: 'applicant:temporary'
  }, jwtSecret, {
    expiresIn: expiresIn.temporary
  });
};

exports.createApplicantToken = (applicant) => {
  return jwt.sign({
    applicant: applicant._id,
    type: 'applicant'
  }, jwtSecret, {
    expiresIn: expiresIn.regular
  });
};

exports.decodeToken = (token) => {
  return jwt.verify(token, jwtSecret);
};