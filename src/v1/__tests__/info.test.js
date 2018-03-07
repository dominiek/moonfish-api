const app = require('../../../src/app');
const router = require('../info');
const config = require('../../config');

const {
  setupDatabase,
  teardownDatabase,
  request
} = require('../../lib/test-utils');

const Applicant = require('../../models/applicant');

beforeAll(async () => {
  app.use(router.routes());
  await setupDatabase();
  await Applicant.remove();
});

beforeEach(async () => {
  await Applicant.remove();
});

afterAll(teardownDatabase);

describe('Test the info API', () => {
  test('It should have valid tokensale info', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    const { details, status } = response.body.data;
    expect(details.maxWhitelistedApplicants).toBe(20);
    expect(details.startTimeTs).toBe(Date.parse(config.get('tokenSale.startTime')));
    expect(status.acceptApplicants).toBe(true);
  });
});