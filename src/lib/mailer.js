const postmark = require('postmark');

exports.sendMail = (config, { to, subject, body }) => {
  if (process.env.MOCK_EMAIL) {
    console.log(`Sending email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body:');
    console.log(body);
  } else {
    const client = new postmark.Client(config.postmark.apikey);
    const env = process.env.NODE_ENV;
    if (env !== 'test') {
      client.sendEmail({
        From: config.postmark.from,
        To: to,
        Subject: subject,
        TextBody: body,
      });
    }
  }
};
