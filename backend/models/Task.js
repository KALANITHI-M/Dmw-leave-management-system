import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Overdue'],
      default: 'Pending',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedDate: {
      type: Date,
      default: null,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Auto-calculate Overdue status before saving
taskSchema.pre('save', function (next) {
  if (this.status !== 'Completed' && new Date() > this.dueDate) {
    this.status = 'Overdue';
  }
  next();
});

// Index for faster queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
