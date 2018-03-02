const fs = require('fs');
const path = require('path');
const { sendMail } = require('./mailer');
console.log(sendMail);
const config = require('../config');
const { template: templateFn } = require('./utils');
const { promisify } = require('util');

const templatesDist = path.join(__dirname, '../../emails/dist');
const templates = {};

const appName = config.get('app.name');

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

exports.sendWelcome = (email, magicToken) => {
  sendMail({
    to: email,
    subject: `Welcome to ${appName} Registration`,
    html: template('welcome.html', { magicToken }),
    text: template('welcome.text', { magicToken })
  });
};