import mongoose from 'mongoose';

const serviceTicketSchema = new mongoose.Schema(
  {
    // Ticket metadata
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
    },

    // User information
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    // Ticket classification
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'On Hold', 'Reopened'],
      default: 'Open',
    },
    category: {
      type: String,
      enum: ['Machine Failure', 'Maintenance Request', 'Technical Support', 'Software Issue', 'Hardware Issue', 'Other'],
      default: 'Other',
    },

    // Dates
    dueDate: {
      type: Date,
      default: null,
    },
    resolvedDate: {
      type: Date,
      default: null,
    },
    closedDate: {
      type: Date,
      default: null,
    },

    // File attachments (initial uploads)
    attachments: [
      {
        filename: String,
        url: String,
        fileType: String, // jpg, png, pdf, docx, etc.
        fileSize: Number, // in bytes
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Proof of work (uploaded by engineer before resolution)
    proofOfWork: [
      {
        filename: String,
        url: String,
        fileType: String,
        fileSize: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        description: String, // Engineer can add description for the proof
      },
    ],

    // Resolution details
    resolutionNotes: {
      type: String,
      default: null,
    },
    closureNotes: {
      type: String,
      default: null,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    // Tracking
    estimatedCompletionTime: {
      type: Number, // in hours
      default: null,
    },
    timeSpentMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-generate ticket number on creation
serviceTicketSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Generate ticket number like TICKET-001, TICKET-002, etc.
    const count = await mongoose.model('ServiceTicket').countDocuments();
    this.ticketNumber = `TICKET-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for faster queries
serviceTicketSchema.index({ assignedTo: 1, status: 1 });
serviceTicketSchema.index({ createdBy: 1 });
serviceTicketSchema.index({ status: 1 });
serviceTicketSchema.index({ priority: 1 });
serviceTicketSchema.index({ ticketNumber: 1 });

const ServiceTicket = mongoose.model('ServiceTicket', serviceTicketSchema);

export default ServiceTicket;
