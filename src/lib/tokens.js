const jwt = require('jsonwebtoken');
const config = require('../lib/config');

const expiresIn = config.get('jwt.expiresIn');
const secrets = {
  applicant: config.get('jwt.secret'),
  admin: config.get('jwt.adminSecret')
};

exports.createApplicantTemporaryToken = (applicant) => {
  return jwt.sign({
    applicantId: applicant._id,
    type: 'applicant:temporary',
    kid: 'applicant',
  }, secrets.applicant, {
    expiresIn: expiresIn.temporary
  });
};

exports.createApplicantToken = (applicant) => {
  return jwt.sign({
    applicantId: applicant._id,
    type: 'applicant',
    kid: 'applicant',
  }, secrets.applicant, {
    expiresIn: expiresIn.regular
  });
};


exports.createAdminTemporaryToken = (email) => {
  return jwt.sign({
    email,
    type: 'admin:temporary',
    kid: 'admin',
  }, secrets.admin, {
    expiresIn: expiresIn.invite
  });
};

exports.createAdminToken = (user) => {
  return jwt.sign({
    userId: user._id,
    type: 'admin',
    kid: 'admin',
  }, secrets.admin, {
    expiresIn: expiresIn.regular
  });
};