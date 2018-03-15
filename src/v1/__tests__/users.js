const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const tokens = require('../../lib/tokens');
const { initialize: initializeEmails } = require('../../lib/emails');
const {
  setupDatabase,
  teardownDatabase,
  request
} = require('../../test-helpers');

const mailer = require('../../lib/mailer');

jest.mock('../../lib/mailer');

beforeAll(async () => {
  await initializeEmails();
  await setupDatabase();
  await User.remove();
});

beforeEach(async () => {
  await User.remove({});
  mailer.sendMail.mockClear();
});

afterAll(teardownDatabase);

describe('/users', () => {
  describe('POST /authenticate', () => {
    it('should fail if the user doesnt exists', async () => {
      const response = await request('POST', '/1/users/authenticate', {
        password: 'new name',
        email: 'food@burger.com'
      });
      expect(response.status).toBe(401);
    });

    it('should fail if password does not match', async () => {
      await User.create({
        email: 'me@users.com',
        name: 'name',
        password: 'some password',
        username: 'moonfish'
      });
      const response = await request('POST', '/1/users/authenticate', {
        password: 'some wrong password',
        email: 'me@users.com'
      });
      expect(response.status).toBe(401);
    });

    it('should work if password is correct', async () => {
      await User.create({
        email: 'me@users.com',
        name: 'name',
        password: 'correct password',
        username: 'moonfish'
      });
      const response = await request('POST', '/1/users/authenticate', {
        password: 'correct password',
        email: 'me@users.com'
      });
      expect(response.status).toBe(200);
      const { payload } = jwt.decode(response.body.data.token, { complete: true });
      expect(payload).toHaveProperty('kid', 'admin');
      expect(payload).toHaveProperty('type', 'admin');
    });
  });

  describe('POST /register', () => {
    it('should only fail on a wrong kind token', async () => {
      const user = await User.create({
        email: 'sun@flower.com',
        name: 'my true name',
        username: 'steven',
      });
      const response = await request('POST', '/1/users/register', {
        token: tokens.createAdminToken(user),
        name: 'name',
        username: 'something',
        password: 'password'
      });
      expect(response.status).toBe(401);
    });

    it('should exchange temporary token for applicant token and update user', async () => {
      const email = 'one@email.com';
      const response = await request('POST', '/1/users/register', {
        token: tokens.createAdminTemporaryToken(email),
        name: 'name',
        username: 'something',
        password: 'password'
      });

      expect(response.status).toBe(200);
      const { payload } = jwt.decode(response.body.data.token, { complete: true });
      expect(payload).toHaveProperty('kid', 'admin');
      expect(payload).toHaveProperty('type', 'admin');
      const updateUser = await User.findOne({ email });
      expect(updateUser.name).toBe('name');
      expect(updateUser.password).toBe(null);
      expect(updateUser).toHaveProperty('hashedPassword');
    });
  });

  describe('POST /invite', () => {
    it('filter out existing users', async () => {
      const admin = await User.create({ email: 'one@other.com', username: 'moonfish', name: 'name' });
      const response = await request('POST', '/1/users/invite', {
        emails: ['one@other.com', 'foo@mom.com']
      }, { admin });
      expect(response.status).toBe(201);
      expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should successfull invite users', async () => {
      const admin = await User.create({ email: 'one@other.com', username: 'moonfish', name: 'name' });
      const response = await request('POST', '/1/users/invite', {
        emails: ['mo@bom.com', 'foo@mom.com']
      }, { admin });
      expect(response.status).toBe(201);
      expect(mailer.sendMail).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /me', () => {
    it('should return the logged in user', async () => {
      const admin = await User.create({
        email: 'me@users.com',
        name: 'name',
        password: 'some password',
        username: 'moonfish'
      });
      const response = await request('PATCH', '/1/users/me', {
        name: 'new name'
      }, { admin });
      expect(response.status).toBe(200);
      const { data } = response.body;
      expect(data.hashedPassword).toBe(undefined);
      expect(data.name).toBe('new name');
    });
  });

  describe('PATCH /me', () => {
    it('should succesful update', async () => {
      const admin = await User.create({
        email: 'me@users.com',
        username: 'moonfish',
        name: 'name'
      });
      const response = await request('PATCH', '/1/users/me', {
        name: 'new name'
      }, { admin });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('new name');
      const newAdmin = await User.findById(admin._id);
      expect(newAdmin.name).toBe('new name');
    });
  });
});