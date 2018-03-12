
const { setupDatabase, teardownDatabase } = require('../../lib/test-utils');
const { initialize: initializeEmails } = require('../../lib/emails');
const Applicant = require('../../models/applicant');
const config = require('../../lib/config');

const {
  apply,
  encodeSession,
  decodeSession,
  register,
  participate,
  exportSafeApplicant,
} = require('../applicants');

beforeAll(async () => {
  await setupDatabase();
  await initializeEmails();
  config.__restore();
});

beforeEach(async () => {
  await Applicant.remove();
});

afterAll(teardownDatabase);

describe('Applicants', () => {
  test('It should be able to apply and get a magic token (failures)', async () => {
    expect.assertions(3);

    await apply({ acceptApplicants: false }, {}).catch((e) => {
      expect(e.message).toMatch('not accepting applicants');
    });
    await apply({ acceptApplicants: true }, {}).catch((e) => {
      expect(e.message).toMatch('valid email address');
    });
    await apply({ acceptApplicants: true }, { email: '' }).catch((e) => {
      expect(e.message).toMatch('valid email address');
    });
  });

  test('It should be able to apply and get a magic token (success)', async () => {
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    expect(applicant.magicToken.length).toBe(128);
    expect(applicant.email).toBe(email);
    expect(!!applicant.magicTokenGeneratedAt).toBe(true);
    expect(applicant.isParticipating).toBe(false);
    expect(applicant.completedRegistration).toBe(false);
    expect(applicant.mnemonicPhrase.split(' ').length).toBe(2);
  });

  test('It should be able to encode and decode a session', () => {
    const magicToken = 'mahou da yo';
    const badToken = 'bla';
    const goodToken = encodeSession(magicToken);
    expect(goodToken.length).toBe(164);
    expect(decodeSession(goodToken)).toBe(magicToken);
    expect(() => decodeSession(badToken)).toThrow('jwt malformed');
  });

  test('It should be able to have a an expiration on the session', async () => {
    const magicToken = 'mahou da yo';
    const token = encodeSession(magicToken, '1s');
    await new Promise(accept => setTimeout(() => accept(), 3000));
    expect(() => decodeSession(token)).toThrow('jwt expired');
  });

  test('It should be able to register (failures)', async () => {
    expect.assertions(5);

    await register({ acceptApplicants: false }, null, {}).catch((e) => {
      expect(e.message).toMatch('not accepting applicants');
    });
    await register({ acceptApplicants: true }, null, {}).catch((e) => {
      expect(e.message).toMatch('valid magic token');
    });
    await register({ acceptApplicants: true }, 'bla', {}).catch((e) => {
      expect(e.message).toMatch('No applicant found');
    });
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    applicant.completedRegistration = true;
    await applicant.save();
    await register({ acceptApplicants: true }, applicant.magicToken, {}).catch((e) => {
      expect(e.message).toMatch('completed registration');
    });
    applicant.completedRegistration = false;
    await applicant.save();
    await register({ acceptApplicants: true }, applicant.magicToken, {}).catch((e) => {
      expect(e.message).toMatch('valid firstName');
    });
  });

  test('It should be able to register (success)', async () => {
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    const registeredApplicant = await register({ acceptApplicants: true }, applicant.magicToken, {
      firstName: 'John',
      lastName: 'Galt',
      ethAmount: 1.0,
    });
    expect(registeredApplicant.completedRegistration).toBe(true);
    expect(registeredApplicant.firstName).toBe('John');
    expect(registeredApplicant.lastName).toBe('Galt');
    expect(registeredApplicant.ethAmount).toBe(1);
  });

  test('It should be fail to register too much eth', async () => {
    config.__set('tokenSale.maxApplicantEthAmount', 1.3);
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    const registeredApplicant = register({ acceptApplicants: true }, applicant.magicToken, {
      firstName: 'John',
      lastName: 'Galt',
      ethAmount: 2.0,
    });
    await expect(registeredApplicant).rejects.toHaveProperty('message', 'EthAmount is too high, max amount 1.3');
  });

  test('It should be able to participate (failures)', async () => {
    expect.assertions(5);

    await participate({ acceptParticipation: false }, null, {}).catch((e) => {
      expect(e.message).toMatch('currently closed');
    });
    await participate({ acceptParticipation: true }, null, {}).catch((e) => {
      expect(e.message).toMatch('valid magic token');
    });
    await participate({ acceptParticipation: true }, 'bla', {}).catch((e) => {
      expect(e.message).toMatch('No applicant found');
    });
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    await participate({ acceptParticipation: true }, applicant.magicToken, {}).catch((e) => {
      expect(e.message).toMatch('not completed');
    });
    applicant.completedRegistration = true;
    await applicant.save();
    await participate({ acceptParticipation: true }, applicant.magicToken, {}).catch((e) => {
      expect(e.message).toMatch('valid ethAddress');
    });
  });

  test('It should be able to participate (expired)', async () => {
    expect.assertions(1);

    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    applicant.completedRegistration = true;
    applicant.magicTokenGeneratedAt = Date.now() - (2 * 3600 * 1000);
    await applicant.save();
    await participate({ acceptParticipation: true }, applicant.magicToken, {}).catch((e) => {
      expect(e.message).toMatch('is expired');
    });
  });

  test('It should be able to participate (success)', async () => {
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    await register({ acceptApplicants: true }, applicant.magicToken, {
      firstName: 'John',
      lastName: 'Galt',
      ethAmount: 1.0,
    });
    const participatingApplicant = await participate(
      { acceptParticipation: true },
      applicant.magicToken, {
        ethAddress: '0x0000000000000000000000000',
      },
    );
    expect(participatingApplicant.completedRegistration).toBe(true);
    expect(participatingApplicant.isParticipating).toBe(true);
    expect(participatingApplicant.firstName).toBe('John');
    expect(participatingApplicant.lastName).toBe('Galt');
    expect(participatingApplicant.ethAmount).toBe(1);
    expect(participatingApplicant.ethAddress).toBe('0x0000000000000000000000000');
  });

  test('It should convert a user to a safe application object without magicToken', async () => {
    const user = await apply({ acceptApplicants: true }, {
      email: 'info@dominiek.com',
    });
    expect(!!exportSafeApplicant(user).email).toBe(true);
    expect(!!user.magicToken).toBe(true);
    expect(!!exportSafeApplicant(user).magicToken).toBe(false);
  });
});
