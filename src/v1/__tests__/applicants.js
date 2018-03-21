const config = require('../../lib/config');
const Applicant = require('../../models/applicant');
const tokens = require('../../lib/tokens');
const jwt = require('jsonwebtoken');
const { initialize: initializeEmails } = require('../../lib/emails');

const {
  setupDatabase,
  teardownDatabase,
  request,
} = require('../../test-helpers');

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
  config.__restore();
  await Applicant.remove();
});

afterAll(teardownDatabase);

describe('/1/applicants', () => {
  describe('POST /apply', () => {
    test('should fail if tokensale not accepting applicants', async () => {
      config.__set('tokenSale', { maxWhitelistedApplicants: 0, allowOversubscribedApplications: false });
      const email = 'john@galt.com';
      const response = await request('POST', '/1/applicants/apply', { email });
      expect(response.status).toBe(423);
    });

    test('should create applicant', async () => {
      const email = 'john@galt.com';
      const response = await request('POST', '/1/applicants/apply', { email });
      const applicate = await Applicant.findOne({ email });
      expect(response.status).toBe(204);
      expect(applicate.email).toBe(email);
    });

    test('should allow a user to signup multiple times', async () => {
      const email = 'stew@food.com';
      await Applicant.create({ email });
      const response = await request('POST', '/1/applicants/apply', { email });
      expect(response.status).toBe(204);
    });
  });

  describe('POST /authenticate', async () => {
    it('should only fail on a wrong kind token', async () => {
      const applicant = await Applicant.create({ email: 'sun@flower.com' });
      const response = await request('POST', '/1/applicants/authenticate', {
        token: tokens.createApplicantToken(applicant)
      });
      expect(response.status).toBe(401);
    });

    it('should exchange temporary token for applicant token', async () => {
      const applicant = await Applicant.create({ email: 'sun@flower.com' });
      const response = await request('POST', '/1/applicants/authenticate', {
        token: tokens.createApplicantTemporaryToken(applicant)
      });

      expect(response.status).toBe(200);
      const { payload } = jwt.decode(response.body.data.token, { complete: true });
      expect(payload).toHaveProperty('kid', 'applicant');
      expect(payload).toHaveProperty('type', 'applicant');
    });
  });

  describe('GET /me', () => {
    it('should return applicant', async () => {
      const applicant = await Applicant.create({ email: 'friends@tree.com' });
      const response = await request('GET', '/1/applicants/me', {}, { applicant });
      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(applicant.email);
      expect(response.mnemonicPhrase).toBe(undefined);
    });
  });

  describe('POST /register', () => {
    it('should fail if not accepting accepting applicants', async () => {
      config.__set('tokenSale', { maxWhitelistedApplicants: 0, allowOversubscribedApplications: false });
      const applicant = await Applicant.create({ email: 'friends@tree.com' });
      const response = await request('POST', '/1/applicants/register', { firstName: 'tree', lastName: 'friend', ethAmount: 1 }, { applicant });
      expect(response.status).toBe(423);
    });

    it('should fail should fail', async () => {
      config.__set('tokenSale', { maxApplicantEthAmount: 10 });
      const applicant = await Applicant.create({ email: 'friends@tree.com' });
      const response = await request('POST', '/1/applicants/register', {
        firstName: 'tree', lastName: 'friend', ethAmount: 11
      }, { applicant });
      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('ethAmount is too high, max amount 10');
    });

    it('should complete register applicant', async () => {
      const applicant = await Applicant.create({ email: 'friends@tree.com' });
      const response = await request('POST', '/1/applicants/register', {
        firstName: 'tree', lastName: 'friend', ethAmount: 1
      }, { applicant });
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('lastName', 'friend');
      expect(response.body.data).toHaveProperty('ethAmount', 1);
      const changedApplicant = await Applicant.findById(applicant._id);
      expect(changedApplicant.ethAmount).toBe(1);
    });
  });

  describe('POST /participate', () => {
    it('should fail if not token sale is closed', async () => {
      config.__set('tokenSale', { endTime: 'Tue, 22 Apr 2018 00:00:00 GMT' });
      const applicant = await Applicant.create({ email: 'friends@tree.com' });
      const response = await request('POST', '/1/applicants/participate', {
        ethAddress: '0xdD3Fd055Eba5596a1a00995014e1B5Fbc6B136bc'
      }, { applicant });
      expect(response.status).toBe(423);
    });

    it('should set ethAddress', async () => {
      const ethAddress = '0xdD3Fd055Eba5596a1a00995014e1B5Fbc6B136bc';
      config.__set('tokenSale', {
        startTime: (new Date()).toGMTString(),
        endTime: (new Date(Date.now() + 10000)).toGMTString()
      });
      const applicant = await Applicant.create({ email: 'friends@tree.com' });
      const response = await request('POST', '/1/applicants/participate', {
        ethAddress
      }, { applicant });
      expect(response.status).toBe(200);
      const changedApplicant = await Applicant.findById(applicant._id);
      expect(changedApplicant.ethAddress).toBe(ethAddress);
      expect(changedApplicant.isParticipating).toBe(true);
    });
  });
});