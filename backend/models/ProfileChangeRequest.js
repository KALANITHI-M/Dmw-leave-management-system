import mongoose from 'mongoose';

const profileChangeRequestSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  requestedChanges: {
    name: String,
    email: String,
    department: String,
    designation: String,
    phoneNumber: String,
  },
  currentData: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    phoneNumber: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  reviewedAt: Date,
  comments: String,
}, {
  timestamps: true,
});

export default mongoose.model('ProfileChangeRequest', profileChangeRequestSchema);
