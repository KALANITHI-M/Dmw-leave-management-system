import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
      unique: true,
    },
    // Start/end times stored as "HH:MM" strings (24-hour, e.g. "06:00")
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
    },
    // Minutes after startTime before employee is considered "late"
    // e.g. startTime "09:00" + lateAfterMinutes 30 → late after 09:30
    lateAfterMinutes: {
      type: Number,
      default: 30,
      min: 0,
    },
    // Total working hours expected per day (used for half-day threshold)
    workingHours: {
      type: Number,
      default: 8,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;
