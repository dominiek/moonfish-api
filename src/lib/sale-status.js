
const config = require('../lib/config');
const Applicant = require('../models/applicant');

exports.calculateStatus = async (nowTs = Date.now(), options = {}) => {
  const {
    startTime,
    endTime,
    maxWhitelistedApplicants,
    maxCumulativeEthAmount,
    allowOversubscribedApplications
  } = {
    ...config.get('tokenSale'),
    ...options,
  };
  // Determine if token sale is active
  const isActive = (nowTs > Date.parse(startTime)) && (nowTs < Date.parse((endTime)));

  // Check if token sale is oversubscribed
  const numWhitelisted = await Applicant.count({ completedRegistration: true });
  const isOverSubscribedByNumPeople = (numWhitelisted >= maxWhitelistedApplicants);

  let isOverSubscribedByEthAmount = false;

  if (maxCumulativeEthAmount) {
    const aggregation = await Applicant.aggregate([
      {
        $group: {
          totalEthAmount: {
            $sum: '$ethAmount',
          },
          _id: '$id',
        },
      },
    ]);

    if (aggregation.length && aggregation[0].totalEthAmount > maxCumulativeEthAmount) {
      isOverSubscribedByEthAmount = true;
    }
  }
  const isOverSubscribed = isOverSubscribedByNumPeople || isOverSubscribedByEthAmount;

  // Determine whether we accept applicants and participation
  const acceptApplicants = !isOverSubscribed || allowOversubscribedApplications;
  const acceptParticipation = isActive;

  return {
    isActive,
    isOverSubscribed,
    isOverSubscribedByNumPeople,
    isOverSubscribedByEthAmount,
    acceptApplicants,
    acceptParticipation,
  };
};