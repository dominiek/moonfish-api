
const { setupMongooseDb, teardownMongooseDb } = require('../../lib/testUtils');
const Applicant = require('../../models/applicant');
const {
  calculateTokensaleStatus,
} = require('../status');

beforeAll(async () => {
  await setupMongooseDb();
});

beforeEach(async () => {
  await Applicant.remove();
});

afterAll(teardownMongooseDb);

describe('Status', () => {
  test('It should calculate status under right conditions', async () => {
    let status;

    // Not active, accepting whitelist applicants
    status = await calculateTokensaleStatus({
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 20,
      allowOversubscribedApplications: false,
    }, new Date(2018, 2, 21));
    expect(status.isOverSubscribed).toBe(false);
    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(true);
    expect(status.acceptParticipation).toBe(false);

    // Active, accepting everything
    status = await calculateTokensaleStatus({
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 20,
      allowOversubscribedApplications: false,
    }, new Date(2018, 2, 23));
    expect(status.isOverSubscribed).toBe(false);
    expect(status.isActive).toBe(true);
    expect(status.acceptApplicants).toBe(true);
    expect(status.acceptParticipation).toBe(true);

    await Applicant.create({
      magicToken: '1',
      email: 'test1@test.com',
      completedRegistration: true,
      ethAmount: 10,
    });
    await Applicant.create({
      magicToken: '2',
      email: 'test2@test.com',
      completedRegistration: true,
      ethAmount: 30,
    });

    // Not active, oversubscribed
    status = await calculateTokensaleStatus({
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 2,
      allowOversubscribedApplications: false,
    }, new Date(2018, 2, 21));
    expect(status.isOverSubscribed).toBe(true);
    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(false);
    expect(status.acceptParticipation).toBe(false);

    // Not active, oversubscribed, allow oversubscribed applicants
    status = await calculateTokensaleStatus({
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 2,
      allowOversubscribedApplications: true,
    }, new Date(2018, 2, 21));
    expect(status.isOverSubscribed).toBe(true);
    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(true);
    expect(status.acceptParticipation).toBe(false);

    // Not active, not oversubscribed
    status = await calculateTokensaleStatus({
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 10,
      allowOversubscribedApplications: false,
      maxCumulativeEthAmount: 100,
    }, new Date(2018, 2, 21));
    expect(status.isOverSubscribed).toBe(false);
    expect(status.isOverSubscribedByNumPeople).toBe(false);
    expect(status.isOverSubscribedByEthAmount).toBe(false);
    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(true);
    expect(status.acceptParticipation).toBe(false);

    // Not active, oversubscribed by eth
    status = await calculateTokensaleStatus({
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 10,
      allowOversubscribedApplications: false,
      maxCumulativeEthAmount: 33,
    }, new Date(2018, 2, 21));
    expect(status.isOverSubscribed).toBe(true);
    expect(status.isOverSubscribedByNumPeople).toBe(false);
    expect(status.isOverSubscribedByEthAmount).toBe(true);
    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(false);
    expect(status.acceptParticipation).toBe(false);
  });
});
