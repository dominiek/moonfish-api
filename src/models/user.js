
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: { type: String, required: true, min: 3 },
  username: { type: String, required: true, min: 3 },
  name: { type: String },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin'] },
  resetPasswordToken: { type: String },
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', schema);
