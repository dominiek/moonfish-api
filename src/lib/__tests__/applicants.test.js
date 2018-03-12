
const { setupDatabase, teardownDatabase } = require('../../lib/test-utils');
const { initialize: initializeEmails } = require('../../lib/emails');
const Applicant = require('../../models/applicant');
const config = require('../../lib/config');

const {
  apply,
  register,
  participate,
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
  test('It should be able to apply (failures)', async () => {
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

  test('It should be able to apply (success)', async () => {
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    expect(applicant.email).toBe(email);
    expect(applicant.isParticipating).toBe(false);
    expect(applicant.completedRegistration).toBe(false);
    expect(applicant.mnemonicPhrase.split(' ').length).toBe(2);
  });

  test('It should be able to register (failures)', async () => {
    expect.assertions(3);

    await register({ acceptApplicants: false }, null, {}).catch((e) => {
      expect(e.message).toMatch('not accepting applicants');
    });
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    applicant.completedRegistration = true;
    await applicant.save();
    await register({ acceptApplicants: true }, applicant, {}).catch((e) => {
      expect(e.message).toMatch('completed registration');
    });
    applicant.completedRegistration = false;
    await applicant.save();
    await register({ acceptApplicants: true }, applicant, {}).catch((e) => {
      expect(e.message).toMatch('valid firstName');
    });
  });

  test('It should be able to register (success)', async () => {
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, { email });
    const registeredApplicant = await register({ acceptApplicants: true }, applicant, {
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
    const applicant = await apply({ acceptApplicants: true }, new Applicant({ email }));
    const registeredApplicant = register({ acceptApplicants: true }, applicant, {
      firstName: 'John',
      lastName: 'Galt',
      ethAmount: 2.0,
    });
    await expect(registeredApplicant).rejects.toHaveProperty('message', 'EthAmount is too high, max amount 1.3');
  });

  test('It should be able to participate (failures)', async () => {
    expect.assertions(3);

    await participate({ acceptParticipation: false }, null, {}).catch((e) => {
      expect(e.message).toMatch('currently closed');
    });
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, new Applicant({ email }));
    await participate({ acceptParticipation: true }, applicant, {}).catch((e) => {
      expect(e.message).toMatch('not completed');
    });
    applicant.completedRegistration = true;
    await applicant.save();
    await participate({ acceptParticipation: true }, applicant, {}).catch((e) => {
      expect(e.message).toMatch('valid ethAddress');
    });
  });

  test('It should be able to participate (success)', async () => {
    const email = 'info@dominiek.com';
    const applicant = await apply({ acceptApplicants: true }, new Applicant({ email }));
    await register({ acceptApplicants: true }, applicant, {
      firstName: 'John',
      lastName: 'Galt',
      ethAmount: 1.0,
    });
    const participatingApplicant = await participate(
      { acceptParticipation: true },
      applicant,
      { ethAddress: '0x0000000000000000000000000' }
    );
    expect(participatingApplicant.completedRegistration).toBe(true);
    expect(participatingApplicant.isParticipating).toBe(true);
    expect(participatingApplicant.firstName).toBe('John');
    expect(participatingApplicant.lastName).toBe('Galt');
    expect(participatingApplicant.ethAmount).toBe(1);
    expect(participatingApplicant.ethAddress).toBe('0x0000000000000000000000000');
  });
});
