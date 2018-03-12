const { initialize: initializeEmails } = require('../../lib/emails');

jest.mock('../mailer');

const { sendMail } = require('../mailer');

const { sendWelcome } = require('../emails');

beforeAll(async () => {
  await initializeEmails();
});

describe('Emails', () => {
  test('sendWelcome', async () => {
    sendWelcome('foo@bar.com', { token: '$token', mnemonicPhrase: '$mnemonicPhrase' });
    const sendMailArgs = sendMail.mock.calls[0][0];
    expect(sendMailArgs.to).toBe('foo@bar.com');
    expect(sendMailArgs.html.includes('$token')).toBe(true);
    expect(sendMailArgs.html.includes('$mnemonicPhrase')).toBe(true);
    expect(sendMailArgs.text.includes('$token')).toBe(true);
    expect(sendMailArgs.text.includes('$mnemonicPhrase')).toBe(true);
  });
});