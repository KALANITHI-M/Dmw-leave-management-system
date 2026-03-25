import mongoose from 'mongoose';

const serviceTicketCommentSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceTicket',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
    },
    attachments: [
      {
        filename: String,
        url: String,
        fileType: String,
        fileSize: Number,
      },
    ],
    isInternal: {
      type: Boolean,
      default: false, // If true, only admins/managers can see this
    },
  },
  { timestamps: true }
);

serviceTicketCommentSchema.index({ ticket: 1, createdAt: -1 });

const ServiceTicketComment = mongoose.model('ServiceTicketComment', serviceTicketCommentSchema);

export default ServiceTicketComment;
