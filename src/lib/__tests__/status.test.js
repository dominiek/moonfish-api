
import { setupMongooseDb, teardownMongooseDb } from '../../lib/testUtils';
import Applicant from '../../models/applicant';
import {
  calculateTokensaleStatus,
} from '../status';

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

    await Applicant.create({ magicToken: '1', email: 'test1@test.com', completedRegistration: true });
    await Applicant.create({ magicToken: '2', email: 'test2@test.com', completedRegistration: true });

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

    // Not active, oversubscribed
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
  });
});
