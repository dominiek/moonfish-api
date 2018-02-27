
const request = require('supertest');
const { app } = require('../../../src');
const api = require('../index');

app.use('/', api({}));

describe('Test the root path', () => {
  test('It should have a valid index response', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body.protocolVersion).toBe(1);
  });
});