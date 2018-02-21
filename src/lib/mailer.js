
import postmark from 'postmark';

export const sendMail = (config, { to, subject, body }) => {
  const client = new postmark.Client(config.postmark.apikey);
  console.log('Sending email: ', to, subject, body);
  const env = process.env.NODE_ENV;
  if (env !== 'test') {
    client.sendEmail({
      From: config.postmark.from,
      To: to,
      Subject: subject,
      TextBody: body,
    });
  }
};
