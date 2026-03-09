import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  { lat: Number, lng: Number, address: String },
  { _id: false }
);

const checkInOutSchema = new mongoose.Schema(
  {
    time: { type: Date, required: true },
    location: locationSchema,
    method: { type: String, enum: ['gps', 'qr', 'manual'], default: 'gps' },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: { type: Date, required: true }, // stored at midnight UTC
    checkIn: checkInOutSchema,
    checkOut: checkInOutSchema,
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'half-day', 'on-leave'],
      default: 'present',
    },
    workingHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
