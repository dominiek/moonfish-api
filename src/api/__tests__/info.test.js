
import request from 'supertest';
import { app } from '../../../src';
import api from '../info';

const config = {
  tokensale: {
    maxWhitelistedMembers: 20,
    deadline: 'Tue, 22 Feb 2018 00:00:00 GMT',
  },
};
app.use('/', api({ config }));

describe('Test the info API', () => {
  test('It should have valid tokensale info', async () => {
    const response = await request(app).get('/details');
    expect(response.statusCode).toBe(200);
    expect(response.body.result.maxWhitelistedMembers).toBe(20);
    expect(response.body.result.deadlineTs).toBe(1519257600000);
  });
});
