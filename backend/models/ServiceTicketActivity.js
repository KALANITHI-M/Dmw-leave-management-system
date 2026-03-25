import mongoose from 'mongoose';

const serviceTicketActivitySchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceTicket',
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'created',
        'assigned',
        'reassigned',
        'status_changed',
        'priority_changed',
        'proof_uploaded',
        'resolution_submitted',
        'resolution_rejected',
        'closed',
        'reopened',
        'comment_added',
        'attachment_added',
      ],
      required: true,
    },
    actionDetails: {
      type: String, // Human-readable description of what changed
    },
    oldValue: mongoose.Schema.Types.Mixed, // Previous value if applicable
    newValue: mongoose.Schema.Types.Mixed, // New value if applicable
  },
  { timestamps: true }
);

serviceTicketActivitySchema.index({ ticket: 1, createdAt: -1 });
serviceTicketActivitySchema.index({ performedBy: 1 });

const ServiceTicketActivity = mongoose.model('ServiceTicketActivity', serviceTicketActivitySchema);

export default ServiceTicketActivity;
