const {
  request
} = require('../../lib/test-utils');
const app = require('../../app');

const router = require('../index');

beforeAll(async () => {
  app.use(router.routes());
});

describe('Test the root path', () => {
  test('It should have a valid index response', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(!!response.body.version).toBe(true);
  });
});