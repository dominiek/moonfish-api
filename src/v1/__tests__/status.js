const config = require('../../lib/config');
const {
  setupDatabase,
  teardownDatabase,
  request
} = require('../../test-helpers');

beforeAll(async () => {
  config.__restore();
  await setupDatabase();
});

afterAll(teardownDatabase);

describe('/1/status', () => {
  it('should have valid tokensale info', async () => {
    const date = new Date();
    config.__set('tokenSale', { maxWhitelistedApplicants: 10, startTime: date.toISOString() });
    const response = await request('GET', '/1/status');
    expect(response.statusCode).toBe(200);
    const { data } = response.body;
    expect(data).toHaveProperty('maxWhitelistedApplicants', 10);
    expect(data).toHaveProperty('startTS', date.getTime());
    expect(data).toHaveProperty('startTime', date.toISOString());
  });
});