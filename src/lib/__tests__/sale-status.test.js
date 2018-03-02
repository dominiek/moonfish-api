
const { setupDatabase, teardownDatabase } = require('../../lib/test-utils');
const Applicant = require('../../models/applicant');

const {
  calculateStatus,
} = require('../sale-status');

beforeAll(async () => {
  await setupDatabase();
});

beforeEach(async () => {
  await Applicant.remove();
});

afterAll(teardownDatabase);

describe('Status', () => {
  test('Not active, accepting whitelist applicants', async () => {
    const status = await calculateStatus(new Date(2018, 2, 21), {
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 20,
      allowOversubscribedApplications: false,
    });

    expect(status.isOverSubscribed).toBe(false);
    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(true);
    expect(status.acceptParticipation).toBe(false);
  });

  test('Active, accepting everything', async () => {
    const status = await calculateStatus(new Date(2018, 2, 23), {
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 20,
      allowOversubscribedApplications: false,
    });

    expect(status.isOverSubscribed).toBe(false);
    expect(status.isActive).toBe(true);
    expect(status.acceptApplicants).toBe(true);
    expect(status.acceptParticipation).toBe(true);
  });

  test('Not active, oversubscribed', async () => {
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
    const status = await calculateStatus(new Date(2018, 2, 21), {
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 2,
      allowOversubscribedApplications: false,
    });

    expect(status.isOverSubscribed).toBe(true);
    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(false);
    expect(status.acceptParticipation).toBe(false);
  });

  test('Not active, oversubscribed, allow oversubscribed applicants', async () => {
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

    const status = await calculateStatus(new Date(2018, 2, 21), {
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 2,
      allowOversubscribedApplications: true,
    });

    expect(status.isOverSubscribed).toBe(true);
    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(true);
    expect(status.acceptParticipation).toBe(false);
  });

  test('Not active, not oversubscribed', async () => {
    const status = await calculateStatus(new Date(2018, 2, 21), {
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 10,
      allowOversubscribedApplications: false,
      maxCumulativeEthAmount: 100,
    });
    expect(status.isOverSubscribed).toBe(false);
    expect(status.isOverSubscribedByNumPeople).toBe(false);
    expect(status.isOverSubscribedByEthAmount).toBe(false);
    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(true);
    expect(status.acceptParticipation).toBe(false);
  });

  test('Not active, oversubscribed by eth', async () => {
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

    const status = await calculateStatus(new Date(2018, 2, 21), {
      startTime: 'Tue, 22 Mar 2018 00:00:00 GMT',
      endTime: 'Tue, 22 Apr 2018 00:00:00 GMT',
      maxWhitelistedApplicants: 10,
      allowOversubscribedApplications: false,
      maxCumulativeEthAmount: 33,
    });

    expect(status.isOverSubscribedByNumPeople).toBe(false);
    expect(status.isOverSubscribedByEthAmount).toBe(true);
    expect(status.isOverSubscribed).toBe(true);

    expect(status.isActive).toBe(false);
    expect(status.acceptApplicants).toBe(false);
    expect(status.acceptParticipation).toBe(false);
  });
});
