
const mongoose = require('mongoose');

exports.context = require('./context');
exports.request = require('./request');

exports.setupDatabase = () => new Promise((resolve) => {
  mongoose.connect('mongodb://localhost/skeleton_test');
  mongoose.connection.once('open', () => {
    resolve();
  });
});

exports.teardownDatabase = () => new Promise((resolve) => {
  mongoose.connection.close();
  resolve();
});