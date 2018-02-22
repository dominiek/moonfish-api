
import request from 'supertest';
import { app } from '../../../src';
import api from '../info';
import {
  setupMongooseDb,
  teardownMongooseDb,
} from '../../lib/testUtils';
import Applicant from '../../models/applicant';

const config = {
  tokensale: {
    maxWhitelistedApplicants: 20,
    startTime: (new Date(Date.now() - (24 * 3600 * 1000))).toUTCString(),
    endTime: (new Date(Date.now() + (24 * 3600 * 1000))).toUTCString(),
  },
};

beforeAll(async () => {
  app.use('/', api({ config }));
  await setupMongooseDb();
  await Applicant.remove();
});

beforeEach(async () => {
  await Applicant.remove();
});

afterAll(teardownMongooseDb);

describe('Test the info API', () => {
  test('It should have valid tokensale info', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    const { details, status } = response.body.result;
    expect(details.maxWhitelistedApplicants).toBe(20);
    expect(details.startTimeTs).toBe(Date.parse(config.tokensale.startTime));
    expect(status.acceptApplicants).toBe(true);
  });
});
