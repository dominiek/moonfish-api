const {
  request
} = require('../lib/test-utils');

const index = require('../index');

describe.only('Test App Index', () => {
  test('It should have a valid index response', async () => {
    const app = await index;
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.version).toBe('string');
  });
});