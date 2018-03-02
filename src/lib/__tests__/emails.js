const { initialize: initializeEmails } = require('../../lib/emails');

jest.mock('../mailer');

// const { sendMail } = require('../mailer');

const { sendWelcome } = require('../emails');

beforeAll(async () => {
  await initializeEmails();
});

describe('Applicants', () => {
  test('sendWelcome', async () => {
    sendWelcome();
  });
});
