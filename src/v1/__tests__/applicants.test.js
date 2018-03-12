const config = require('../../lib/config');

const app = require('../../../src/app');
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
  await initializeEmails();
  await setupDatabase();
  await Applicant.remove();
  config.__set('tokenSale', {
    startTime: (new Date(Date.now() - (24 * 3600 * 1000))).toUTCString(),
    endTime: (new Date(Date.now() + (24 * 3600 * 1000))).toUTCString(),
  }, true);
});

beforeEach(async () => {
  await Applicant.remove();
});

afterAll(teardownDatabase);

describe('/1/applicants', () => {
  test('It should allow us to apply to token sale', async () => {
    let response;
    let data;
    let error;

    const body = {
      email: 'john@galt.com',
    };

    response = await request(app)
      .post('/1/applicants/apply')
      .send(body);

    ({ data, error } = response.body);

    expect(response.status).toBe(200);
    expect(data.email).toBe(body.email);
    expect(!!data.magicToken).toBe(false);
    expect(!!data.mnemonicPhrase).toBe(true);

    const applicant = await Applicant.findOne({ email: 'john@galt.com' });
    expect(!!applicant).toBe(true);

    response = await request(app)
      .post('/1/applicants/sessions')
      .send({ magicToken: 'wrong' });

    ({ data, error } = response.body);

    expect(error.message).toBe('Invalid magic token');

    response = await request(app)
      .post('/1/applicants/sessions')
      .send({ magicToken: applicant.magicToken });

    ({ data, error } = response.body);

    expect(error).toBe(undefined);
    const { token } = data;
    expect(!!token).toBe(true);

    response = await request(app)
      .get('/1/applicants/sessions')
      .set(...generateSessionHeader(token));

    ({ data, error } = response.body);

    expect(error).toBe(undefined);
    expect(data.email).toBe(body.email);
    expect(!!data.magicToken).toBe(false);
  });

  test('It should allow us to finalize registration', async () => {
    let response;
    let data;
    let error;

    const email = 'john@galt.com';
    const applicant = await apply({ email });

    response = await request(app)
      .post('/1/applicants/sessions')
      .send({ magicToken: applicant.magicToken });

    ({ data, error } = response.body);
    expect(error).toBe(undefined);
    const { token } = data;
    expect(!!token).toBe(true);

    response = await request(app)
      .post('/1/applicants/register')
      .set(...generateSessionHeader(`${token}_badtoken`));
    ({ data, error } = response.body);

    expect(error.message).toBe('invalid signature');

    response = await request(app)
      .post('/1/applicants/register')
      .set(...generateSessionHeader(token));
    ({ data, error } = response.body);
    expect(error.message).toBe('Need a valid firstName');

    response = await request(app)
      .post('/1/applicants/register')
      .send({
        firstName: 'John',
        lastName: 'Galt',
        ethAmount: 3.0,
      })
      .set(...generateSessionHeader(token));
    ({ data, error } = response.body);

    expect(error).toBe(undefined);
    expect(data.email).toBe(email);
    expect(data.completedRegistration).toBe(true);
    expect(data.firstName).toBe('John');
    expect(data.lastName).toBe('Galt');
    expect(!!data.mnemonicPhrase).toBe(false);
    expect(data.ethAmount).toBe(3.0);
  });

  test('It should allow us to participate', async () => {
    let response;
    let data;
    let error;

    const email = 'john@galt.com';
    const applicant = await apply({ email });

    await register({ acceptApplicants: true }, applicant.magicToken, {
      email,
      firstName: 'John',
      lastName: 'Galt',
      ethAmount: 3.0,
    });

    response = await request(app)
      .post('/1/applicants/sessions')
      .send({ magicToken: applicant.magicToken });

    ({ data, error } = response.body);

    expect(error).toBe(undefined);
    const { token } = data;
    expect(!!token).toBe(true);

    response = await request(app)
      .post('/1/applicants/participate')
      .send({ });

    ({ data, error } = response.body);

    expect(error.message).toBe('Authentication required');

    response = await request(app)
      .post('/1/applicants/participate')
      .set(...generateSessionHeader(token));
    ({ data, error } = response.body);

    expect(error.message).toBe('Need a valid ethAddress');

    response = await request(app)
      .post('/1/applicants/participate')
      .send({
        magicToken: applicant.magicToken,
        ethAddress: '0x00',
      })
      .set(...generateSessionHeader(token));

    ({ data, error } = response.body);

    expect(error).toBe(undefined);
    expect(data.email).toBe(email);
    expect(data.completedRegistration).toBe(true);
    expect(data.firstName).toBe('John');
    expect(data.lastName).toBe('Galt');
    expect(data.ethAmount).toBe(3.0);
    expect(data.ethAddress).toBe('0x00');
    expect(!!data.mnemonicPhrase).toBe(false);
  });
});
