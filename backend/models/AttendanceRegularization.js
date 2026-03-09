import mongoose from 'mongoose';

const regularizationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    requestedCheckIn: {
      type: Date,
    },
    requestedCheckOut: {
      type: Date,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
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
    reviewedAt: {
      type: Date,
    },
    hrComments: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

regularizationSchema.index({ employeeId: 1, date: 1 });

const AttendanceRegularization = mongoose.model('AttendanceRegularization', regularizationSchema);
export default AttendanceRegularization;
