
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  email: { type: String, required: true, min: 3 },
  magicToken: { type: String, required: true },
  magicTokenGeneratedAt: { type: Date, default: Date.now },
  completedRegistration: { type: Boolean, default: false, required: true },
  isParticipating: { type: Boolean, default: false, required: true },
  ethAddress: { type: String, min: 10 },
  ethAmount: { type: Number },
  firstName: { type: String, min: 1 },
  lastName: { type: String, min: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Applicant || mongoose.model('Applicant', schema);