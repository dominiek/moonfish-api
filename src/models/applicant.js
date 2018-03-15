
const { omit } = require('lodash');
const mongoose = require('mongoose');
const Mnemonic = require('bitcore-mnemonic');

const schema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  completedRegistration: { type: Boolean, default: false },
  isParticipating: { type: Boolean, default: false },
  mnemonicPhrase: {
    type: String,
    default: () => {
      const mnemonic = new Mnemonic();
      return mnemonic.toString().split(' ').slice(0, 2).join(' ');
    }
  },
  ethAddress: { type: String, match: /^0x[a-fA-F0-9]{40}$/ },
  ethAmount: { type: Number },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
}, {
  timestamps: true
});

schema.methods.toResource = function toResource() {
  return {
    id: this._id,
    ...omit(this.toObject(), ['_id', 'mnemonicPhrase'])
  };
};

module.exports = mongoose.models.Applicant || mongoose.model('Applicant', schema);
