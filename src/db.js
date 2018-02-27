
const mongoose = require('mongoose');

module.exports = ({ config }) => new Promise((resolve) => {
  // connect to a database if needed, then pass it to `callback`:
  mongoose.connect(config.mongo.uri);
  mongoose.connection.once('open', () => {
    resolve(mongoose.connection);
  });
});
