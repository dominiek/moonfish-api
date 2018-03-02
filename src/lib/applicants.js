const { randomBytes, createHash } = require('crypto');
const jwt = require('jsonwebtoken');
const Mnemonic = require('bitcore-mnemonic');

const config = require('../config');
const Applicant = require('../models/applicant');
const { sendWelcome } = require('./emails');


const JWT_EXPIRY = '2h';
const MAGIC_TOKEN_EXPIRY_SECONDS = 3600;

const jwtSecret = config.get('jwt.secret');

exports.apply = async (tokensaleStatus, {
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
  const mnemonic = new Mnemonic();
  applicant.mnemonicPhrase = mnemonic.toString().split(' ').slice(0, 2).join(' ');
  await applicant.save();

  await sendWelcome(email, applicant.toObject());
  return applicant;
};

exports.exportSafeApplicant = (applicant) => {
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

exports.getApplicantByMagicToken = magicToken => Applicant.findOne({ magicToken });

exports.isValidMagicToken = async (magicToken) => {
  const applicant = await Applicant.findOne({ magicToken });
  return !!applicant;
};

exports.isExpiredMagicToken = (magicTokenGeneratedAt, setNow = null) => {
  const now = setNow || Date.now();
  if ((Date.parse(magicTokenGeneratedAt) + (MAGIC_TOKEN_EXPIRY_SECONDS * 1000)) < now) {
    return true;
  }
  return false;
};

exports.encodeSession = (magicToken, expiresIn) =>
  jwt.sign({ magicToken }, jwtSecret, { expiresIn: (expiresIn || JWT_EXPIRY) });

exports.decodeSession = (token) => {
  const payload = jwt.verify(token, jwtSecret);
  if (!payload || !payload.magicToken) throw new Error('Invalid Token');
  return payload.magicToken;
};

exports.register = async (tokensaleStatus, magicToken, {
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
  if (exports.isExpiredMagicToken(applicant.magicTokenGeneratedAt)) {
    throw new Error('Magic token is expired');
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

exports.participate = async (tokensaleStatus, magicToken, {
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
  if (exports.isExpiredMagicToken(applicant.magicTokenGeneratedAt)) {
    throw new Error('Magic token is expired');
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
