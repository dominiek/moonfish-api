

import Applicant from '../models/applicant';

export const calculateTokensaleStatus = async (config, setNowTs = null) => {
  const startTimeTs = Date.parse(config.startTime);
  const endTimeTs = Date.parse(config.endTime);
  let nowTs = Date.now();
  if (setNowTs) nowTs = setNowTs;
  const numWhitelisted = await Applicant.count({ completedRegistration: true });
  const isOverSubscribed = (numWhitelisted >= config.maxWhitelistedApplicants);
  const isActive = (nowTs > startTimeTs) && (nowTs < endTimeTs);
  const acceptApplicants = !isOverSubscribed || config.allowOversubscribedApplications;
  const acceptParticipation = isActive;
  return {
    isActive,
    isOverSubscribed,
    acceptApplicants,
    acceptParticipation,
  };
};
