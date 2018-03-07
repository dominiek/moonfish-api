const config = require('../../config');

config.setTestConfig({
  tokenSale: {
    maxWhitelistedApplicants: 20,
    startTime: (new Date(Date.now() - (24 * 3600 * 1000))).toUTCString(),
    endTime: (new Date(Date.now() + (24 * 3600 * 1000))).toUTCString(),
    allowOversubscribedApplications: true,
    maxCumulativeEthAmount: false,
  }
});

const app = require('../../../src/app');
const router = require('../applicants');
const Applicant = require('../../models/applicant');
const { initialize: initializeEmails } = require('../../lib/emails');

const {
  setupDatabase,
  teardownDatabase,
  generateSessionHeader,
  request
} = require('../../lib/test-utils');

const {
  apply,
  register,
} = require('../../lib/applicants');

beforeAll(async () => {
  app.use(router.routes());

  await initializeEmails();
  await setupDatabase();
  await Applicant.remove();
});

beforeEach(async () => {
  await Applicant.remove();
});

afterAll(teardownDatabase);

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
    expect(!!result.mnemonicPhrase).toBe(true);

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
      .post('/sessions')
      .send({ magicToken: applicant.magicToken });

    ({ result, error } = response.body);
    expect(error).toBe(undefined);
    const { token } = result;
    expect(!!token).toBe(true);

    response = await request(app)
      .post('/register')
      .set(...generateSessionHeader(`${token}_badtoken`));
    ({ result, error } = response.body);

    expect(error.message).toBe('invalid signature');

    response = await request(app)
      .post('/register')
      .set(...generateSessionHeader(token));
    ({ result, error } = response.body);
    expect(error.message).toBe('Need a valid firstName');

    response = await request(app)
      .post('/register')
      .send({
        firstName: 'John',
        lastName: 'Galt',
        ethAmount: 3.0,
      })
      .set(...generateSessionHeader(token));
    ({ result, error } = response.body);
    expect(error).toBe(undefined);
    expect(result.email).toBe(email);
    expect(result.completedRegistration).toBe(true);
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Galt');
    expect(!!result.mnemonicPhrase).toBe(false);
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
      .post('/sessions')
      .send({ magicToken: applicant.magicToken });

    ({ result, error } = response.body);

    expect(error).toBe(undefined);
    const { token } = result;
    expect(!!token).toBe(true);

    response = await request(app)
      .post('/participate')
      .send({ });

    ({ result, error } = response.body);

    expect(error.message).toBe('Authentication required');

    response = await request(app)
      .post('/participate')
      .set(...generateSessionHeader(token));
    ({ result, error } = response.body);

    expect(error.message).toBe('Need a valid ethAddress');

    response = await request(app)
      .post('/participate')
      .send({
        magicToken: applicant.magicToken,
        ethAddress: '0x00',
      })
      .set(...generateSessionHeader(token));

    ({ result, error } = response.body);

    expect(error).toBe(undefined);
    expect(result.email).toBe(email);
    expect(result.completedRegistration).toBe(true);
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Galt');
    expect(result.ethAmount).toBe(3.0);
    expect(result.ethAddress).toBe('0x00');
    expect(!!result.mnemonicPhrase).toBe(false);
  });
});
