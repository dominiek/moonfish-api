

const Applicant = require('../models/applicant');

exports.calculateTokensaleStatus = async (config, setNowTs = null) => {
  // Determine if token sale is active
  const startTimeTs = Date.parse(config.startTime);
  const endTimeTs = Date.parse(config.endTime);
  let nowTs = Date.now();
  if (setNowTs) nowTs = setNowTs;
  const isActive = (nowTs > startTimeTs) && (nowTs < endTimeTs);

  // Check if token sale is oversubscribed
  const numWhitelisted = await Applicant.count({ completedRegistration: true });
  const isOverSubscribedByNumPeople = (numWhitelisted >= config.maxWhitelistedApplicants);
  const { maxCumulativeEthAmount } = config;
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
    if (aggregation[0].totalEthAmount > maxCumulativeEthAmount) {
      isOverSubscribedByEthAmount = true;
    }
  }
  const isOverSubscribed = isOverSubscribedByNumPeople || isOverSubscribedByEthAmount;

  // Determine whether we accept applicants and participation
  const acceptApplicants = !isOverSubscribed || config.allowOversubscribedApplications;
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
