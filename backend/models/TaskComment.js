import mongoose from 'mongoose';

const taskCommentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
    },
    attachments: [
      {
        filename: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

// Index for faster queries
taskCommentSchema.index({ taskId: 1, createdAt: -1 });

const TaskComment = mongoose.model('TaskComment', taskCommentSchema);

export default TaskComment;
