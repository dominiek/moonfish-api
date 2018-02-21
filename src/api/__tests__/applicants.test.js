/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

import request from 'supertest';
import controller from '../applicants';
import Applicant from '../../models/applicant';

import { app, jsonErrorHandler } from '../../../src';
import {
  setupMongooseDb,
  teardownMongooseDb,
  generateSessionHeader,
} from '../../lib/testUtils';
import {
  apply,
  register,
} from '../../lib/applicants';

const JWT_SECRET = 'testo1';
const config = {
  tokensale: {
    maxWhitelistedApplicants: 20,
    startTime: (new Date(Date.now() - (24 * 3600 * 1000))).toUTCString(),
    endTime: (new Date(Date.now() + (24 * 3600 * 1000))).toUTCString(),
  },
  jwt: {
    secret: JWT_SECRET,
  },
};
beforeAll(async () => {
  app.use('/', controller({ config }));
  app.use(jsonErrorHandler);

  await setupMongooseDb();
  await Applicant.remove();
});

beforeEach(async () => {
  await Applicant.remove();
});

afterAll(teardownMongooseDb);

describe('Applicants', () => {
  test('It should allow us to apply to token sale', async () => {
    let response;
    let result;
    let error;

    const params = {
      email: 'john@galt.com',
    };
    response = await request(app)
      .post('/apply')
      .send(params);
    ({ result, error } = response.body);
    expect(error).toBe(undefined);
    expect(result.email).toBe(params.email);
    expect(!!result.magicToken).toBe(false);
    const applicant = await Applicant.findOne({ email: 'john@galt.com' });
    expect(!!applicant).toBe(true);

    response = await request(app)
      .post('/sessions')
      .send({ magicToken: 'wrong' });
    ({ result, error } = response.body);
    expect(error.message).toBe('Invalid magic token');

    response = await request(app)
      .post('/sessions')
      .send({ magicToken: applicant.magicToken });
    ({ result, error } = response.body);
    expect(error).toBe(undefined);
    const { token } = result;
    expect(!!token).toBe(true);

    response = await request(app)
      .get('/sessions')
      .set(...generateSessionHeader(token));
    ({ result, error } = response.body);
    expect(error).toBe(undefined);
    expect(result.email).toBe(params.email);
    expect(!!result.magicToken).toBe(false);
  });
  test('It should allow us to finalize registration', async () => {
    let response;
    let result;
    let error;

    const email = 'john@galt.com';
    const applicant = await apply({ acceptApplicants: true }, { email });

    response = await request(app)
      .post('/register')
      .send({ magicToken: 'wrong' });
    ({ result, error } = response.body);
    expect(error.message).toBe('No applicant found with that magic token');

    response = await request(app)
      .post('/register')
      .send({ magicToken: applicant.magicToken });
    ({ result, error } = response.body);
    expect(error.message).toBe('Need a valid firstName');

    response = await request(app)
      .post('/register')
      .send({
        magicToken: applicant.magicToken,
        firstName: 'John',
        lastName: 'Galt',
        ethAmount: 3.0,
      });
    ({ result, error } = response.body);
    expect(error).toBe(undefined);
    expect(result.email).toBe(email);
    expect(result.completedRegistration).toBe(true);
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Galt');
    expect(result.ethAmount).toBe(3.0);
  });
  test('It should allow us to participate', async () => {
    let response;
    let result;
    let error;

    const email = 'john@galt.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    await register({ acceptApplicants: true }, applicant.magicToken, {
      email,
      firstName: 'John',
      lastName: 'Galt',
      ethAmount: 3.0,
    });

    response = await request(app)
      .post('/participate')
      .send({ magicToken: 'wrong' });
    ({ result, error } = response.body);
    expect(error.message).toBe('No applicant found with that magic token');

    response = await request(app)
      .post('/participate')
      .send({ magicToken: applicant.magicToken });
    ({ result, error } = response.body);
    expect(error.message).toBe('Need a valid ethAddress');

    response = await request(app)
      .post('/participate')
      .send({
        magicToken: applicant.magicToken,
        ethAddress: '0x00',
      });
    ({ result, error } = response.body);
    expect(error).toBe(undefined);
    expect(result.email).toBe(email);
    expect(result.completedRegistration).toBe(true);
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Galt');
    expect(result.ethAmount).toBe(3.0);
    expect(result.ethAddress).toBe('0x00');
  });
});
