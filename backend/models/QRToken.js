import mongoose from 'mongoose';

const qrTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    date: { type: Date, required: true }, // stored at midnight UTC
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

qrTokenSchema.index({ date: 1 }, { unique: true });

const QRToken = mongoose.model('QRToken', qrTokenSchema);
export default QRToken;
