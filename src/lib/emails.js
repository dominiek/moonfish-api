const fs = require('fs');
const path = require('path');
const { sendMail } = require('./mailer');
const config = require('../lib/config');
const { template: templateFn } = require('./utils');
const { promisify } = require('util');

const templatesDist = path.join(__dirname, '../../emails/dist');
const templates = {};

const defaultOptions = config.get('website');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

exports.initialize = async () => {
  const files = await readdir(templatesDist);
  await Promise.all(files.map(file => {
    return readFile(path.join(templatesDist, file)).then((str) => {
      templates[file] = str.toString();
    });
  }));
};

function template(templateName, map) {
  const templateStr = templates[templateName];
  if (!templateStr) throw Error(`Cant find template by ${templateName}. Available templates: ${Object.keys(templates)}`);
  return templateFn(templateStr, map);
}

exports.sendWelcome = (email, { token, mnemonicPhrase }) => {
  const options = {
    ...defaultOptions,
    token,
    mnemonicPhrase
  };

  sendMail({
    to: email,
    subject: `Welcome to ${defaultOptions.name} Registration`,
    html: template('welcome.html', options),
    text: template('welcome.text', options)
  });
};

exports.sendAdminInvite = (email, { token }) => {
  const options = {
    ...defaultOptions,
    token
  };

  sendMail({
    to: email,
    subject: `Admin Invitation for ${defaultOptions.name}`,
    html: template('admin-invite.html', options),
    text: template('admin-invite.text', options)
  });
};