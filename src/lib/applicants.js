
import { randomBytes, createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import Applicant from '../models/applicant';
import { sendMail } from './mailer';

require('babel-core/register');
require('babel-polyfill');

const JWT_EXPIRY = '2h';

export const apply = async (config, tokensaleStatus, {
  email,
}) => {
  if (!tokensaleStatus.acceptApplicants) {
    throw new Error('Token sale is not accepting applicants currently');
  }

  if (!email || !email.length) {
    throw new Error('Need a valid email address');
  }
  const randStr = randomBytes(512).toString('hex');
  const magicToken = createHash('sha512')
    .update(email + randStr, 'utf8')
    .digest('hex');

  let applicant = await Applicant.findOne({ email });
  if (!applicant) {
    applicant = new Applicant({
      email,
    });
  }
  applicant.magicToken = magicToken;
  applicant.magicTokenGeneratedAt = Date.now();
  await applicant.save();

  sendMail(config, {
    to: email,
    subject: `Welcome to ${config.app.name} Registration`,
    body: `
To proceed with your registration, use the following link:

https://${config.app.domain}/register?magicToken=${magicToken}

Best,
The ${config.app.name} Team`,
  });

  return applicant;
};

export const exportSafeApplicant = (applicant) => {
  const object = applicant.toObject();
  const {
    email,
    firstName,
    lastName,
    createdAt,
    completedRegistration,
    isParticipating,
    ethAmount,
    ethAddress,
  } = object;
  return {
    email,
    firstName,
    lastName,
    createdAt,
    completedRegistration,
    isParticipating,
    ethAmount,
    ethAddress,
  };
};

export const getApplicantByMagicToken = magicToken => Applicant.findOne({ magicToken });

export const isValidMagicToken = async (magicToken) => {
  const applicant = await getApplicantByMagicToken(magicToken);
  return !!applicant;
};

export const encodeSession = (jwtSecret, magicToken) =>
  jwt.sign({ magicToken }, jwtSecret, { expiresIn: JWT_EXPIRY });

export const decodeSession = (jwtSecret, token) => {
  const payload = jwt.verify(token, jwtSecret);
  if (!payload || !payload.magicToken) throw new Error('Invalid Token');
  return payload.magicToken;
};

export const register = async (tokensaleStatus, magicToken, {
  firstName,
  lastName,
  ethAmount,
}) => {
  if (!tokensaleStatus.acceptApplicants) {
    throw new Error('Token sale is not accepting applicants currently');
  }

  if (!magicToken || !magicToken.length) {
    throw new Error('Need a valid magic token');
  }

  const applicant = await Applicant.findOne({ magicToken });
  if (!applicant) {
    throw new Error('No applicant found with that magic token');
  }
  if (applicant.completedRegistration) {
    throw new Error('Applicant already completed registration');
  }

  if (!firstName || !firstName.length) {
    throw new Error('Need a valid firstName');
  }

  if (!lastName || !lastName.length) {
    throw new Error('Need a valid lastName');
  }

  if (!ethAmount) {
    throw new Error('Need a valid ethAmount');
  }

  const normalizedEthAmount = parseFloat(ethAmount, 10);
  if (Number.isNaN(normalizedEthAmount) || normalizedEthAmount <= 0.0) {
    throw new Error('Need a valid ethAmount');
  }

  applicant.firstName = firstName;
  applicant.lastName = lastName;
  applicant.ethAmount = normalizedEthAmount;
  applicant.completedRegistration = true;

  await applicant.save();
  return applicant;
};

export const participate = async (tokensaleStatus, magicToken, {
  ethAddress,
}) => {
  if (!tokensaleStatus.acceptParticipation) {
    throw new Error('Token sale is currently closed');
  }
  if (!magicToken || !magicToken.length) {
    throw new Error('Need a valid magic token');
  }

  const applicant = await Applicant.findOne({ magicToken });
  if (!applicant) {
    throw new Error('No applicant found with that magic token');
  }
  if (!applicant.completedRegistration) {
    throw new Error('Registration was not completed');
  }
  if (!ethAddress || !ethAddress.length) {
    throw new Error('Need a valid ethAddress');
  }
  applicant.ethAddress = ethAddress;
  applicant.isParticipating = true;

  await applicant.save();
  return applicant;
};
