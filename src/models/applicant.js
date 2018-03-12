
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: { type: String, required: true, min: 3 },
  completedRegistration: { type: Boolean, default: false, required: true },
  isParticipating: { type: Boolean, default: false, required: true },
  mnemonicPhrase: { type: String },
  ethAddress: { type: String, min: 10 },
  ethAmount: { type: Number },
  firstName: { type: String, min: 1 },
  lastName: { type: String, min: 1 },
}, {
  timestamps: true
});

module.exports = mongoose.models.Applicant || mongoose.model('Applicant', schema);
