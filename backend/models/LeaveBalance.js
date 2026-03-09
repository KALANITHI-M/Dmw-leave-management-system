import mongoose from 'mongoose';

const balanceEntrySchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      required: true,
      enum: ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Other'],
    },
    allocated: { type: Number, required: true, default: 0 },
    used:      { type: Number, required: true, default: 0 },
    pending:   { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    year: { type: Number, required: true },
    balances: [balanceEntrySchema],
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

export default LeaveBalance;
