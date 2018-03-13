const Mnemonic = require('bitcore-mnemonic');
const { createApplicantTemporaryToken } = require('../lib/tokens');

const config = require('../lib/config');
const Applicant = require('../models/applicant');
const { sendWelcome } = require('./emails');

exports.apply = async (tokensaleStatus, {
  email,
}) => {
  if (!tokensaleStatus.acceptApplicants) {
    throw new Error('Token sale is not accepting applicants currently');
  }

  if (!email || !email.length) {
    throw new Error('Need a valid email address');
  }

  let applicant = await Applicant.findOne({ email });
  if (!applicant) {
    applicant = new Applicant({
      email,
    });
  }
  const mnemonic = new Mnemonic();
  applicant.mnemonicPhrase = mnemonic.toString().split(' ').slice(0, 2).join(' ');
  await applicant.save();

  await sendWelcome(email, {
    token: createApplicantTemporaryToken(applicant),
    mnemonicPhrase: applicant.mnemonicPhrase
  });

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

exports.register = async (tokensaleStatus, applicant, {
  firstName,
  lastName,
  ethAmount,
}) => {
  if (!tokensaleStatus.acceptApplicants) {
    throw new Error('Token sale is not accepting applicants currently');
  }

  if (applicant.completedRegistration) {
    throw new Error('Applicant already completed registration');
  }

  const maxApplicantEthAmount = config.get('tokenSale.maxApplicantEthAmount');
  if (maxApplicantEthAmount && ethAmount > maxApplicantEthAmount) {
    throw new Error(`EthAmount is too high, max amount ${maxApplicantEthAmount}`);
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

  Object.assign(applicant, {
    firstName,
    lastName,
    ethAmount: normalizedEthAmount,
    completedRegistration: true
  });

  await applicant.save();
  return applicant;
};

exports.participate = async (tokensaleStatus, applicant, {
  ethAddress,
}) => {
  if (!tokensaleStatus.acceptParticipation) {
    throw new Error('Token sale is currently closed');
  }
  if (!applicant.completedRegistration) {
    throw new Error('Registration was not completed');
  }
  if (!ethAddress || !ethAddress.length) {
    throw new Error('Need a valid ethAddress');
  }
  Object.assign(applicant, {
    ethAddress,
    isParticipating: true
  });

  await applicant.save();
  return applicant;
};
