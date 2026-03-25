import Task from '../models/Task.js';
import TaskComment from '../models/TaskComment.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';

// Store file in memory, then stream to Cloudinary
const memStorage = multer.memoryStorage();

const proofFileFilter = (req, file, cb) => {
  // Only allow image files for task proofs
  const allowed = /jpeg|jpg|png/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG image files are allowed for proof'));
  }
};

export const uploadProofMiddleware = multer({ 
  storage: memStorage, 
  fileFilter: proofFileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } 
}).single('proof');

// Upload buffer to Cloudinary and return secure URL
const uploadToCloudinary = (buffer, mimetype) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'task-proofs',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });

// Upload task completion proof (Employee)
export const uploadCompletionProof = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if employee is assigned to this task
    const isAssigned = task.assignedTo.some((id) => id.toString() === req.user._id.toString());
    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Validate file is an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files (photos/screenshots) are accepted' });
    }

    const secureUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    task.completionProofUrl = secureUrl;
    await task.save();
    await task.populate(['assignedTo', 'createdBy', 'approvedBy']);

    res.json({ message: 'Proof uploaded successfully', task });
  } catch (error) {
    console.error('Proof upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new task (Manager/Admin only)
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, startDate, dueDate } = req.body;
    const createdBy = req.user._id;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Task description is required' });
    }

    if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
      return res.status(400).json({ message: 'Select at least one employee' });
    }

    const uniqueAssignees = [...new Set(assignedTo)];
    const hasInvalidId = uniqueAssignees.some((id) => !mongoose.Types.ObjectId.isValid(id));
    if (hasInvalidId) {
      return res.status(400).json({ message: 'Invalid employee selection' });
    }

    if (!startDate || !dueDate) {
      return res.status(400).json({ message: 'Start date and due date are required' });
    }

    const parsedStartDate = new Date(startDate);
    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start date or due date' });
    }

    if (parsedDueDate < parsedStartDate) {
      return res.status(400).json({ message: 'Due date must be after start date' });
    }

    // Validate that all assigned employees exist
    const employees = await Employee.find({
      _id: { $in: uniqueAssignees },
      role: 'employee',
      isActive: { $ne: false },
    });
    if (employees.length !== uniqueAssignees.length) {
      return res.status(400).json({ message: 'One or more selected employees are invalid or inactive' });
    }

    const task = new Task({
      title: title.trim(),
      description: description.trim(),
      assignedTo: uniqueAssignees,
      createdBy,
      priority,
      startDate: parsedStartDate,
      dueDate: parsedDueDate,
    });

    await task.save();
    await task.populate(['assignedTo', 'createdBy']);

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(', '),
      });
    }

    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

// Get all tasks (with filtering options)
export const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, createdBy, sortBy = '-createdAt' } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (createdBy) filters.createdBy = createdBy;

    const tasks = await Task.find(filters)
      .populate('assignedTo', 'name email designation')
      .populate('createdBy', 'name email')
      .sort(sortBy)
      .lean();

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// Get tasks assigned to current employee
export const getMyTasks = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { status, priority, sortBy = '-dueDate' } = req.query;
    const filters = { assignedTo: employeeId };

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const tasks = await Task.find(filters)
      .populate('createdBy', 'name email')
      .sort(sortBy)
      .lean();

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your tasks', error: error.message });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email designation')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

// Update task (Manager/Admin)
export const updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, startDate, dueDate, status, progress } =
      req.body;

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (priority) updates.priority = priority;
    if (startDate) updates.startDate = new Date(startDate);
    if (dueDate) updates.dueDate = new Date(dueDate);
    if (status) {
      updates.status = status;
      if (status === 'Completed') {
        updates.completedDate = new Date();
      }
    }
    if (progress !== undefined) updates.progress = progress;

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true }).populate([
      'assignedTo',
      'createdBy',
    ]);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// Update task progress (Employee)
export const updateTaskProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const employeeId = req.user._id;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if employee is assigned to this task
    const isAssigned = task.assignedTo.some((id) => id.toString() === employeeId.toString());
    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    if (progress !== undefined) {
      task.progress = Math.min(100, Math.max(0, progress));
    }

    await task.save();
    await task.populate(['assignedTo', 'createdBy', 'approvedBy']);

    res.json({ message: 'Task progress updated', task });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task progress', error: error.message });
  }
};

// Submit task for HR approval (Employee - when they mark 100% complete)
export const submitTaskForApproval = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if employee is assigned to this task
    const isAssigned = task.assignedTo.some((id) => id.toString() === employeeId.toString());
    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    if (task.progress !== 100) {
      return res.status(400).json({ message: 'Task progress must be 100% to submit for approval' });
    }

    if (!task.completionProofUrl) {
      return res.status(400).json({ message: 'Please upload completion proof (photo/screenshot) before submitting' });
    }

    task.status = 'Completed';
    task.approvalStatus = 'Pending Approval';
    task.submissionDate = new Date();

    await task.save();
    await task.populate(['assignedTo', 'createdBy', 'approvedBy']);

    res.json({ message: 'Task submitted for HR approval', task });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting task for approval', error: error.message });
  }
};

// Approve task completion (HR only)
export const approveTaskCompletion = async (req, res) => {
  try {
    const { approvalNotes } = req.body;
    const hrId = req.user._id;

    // Verify user is HR
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Only HR can approve tasks' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.approvalStatus !== 'Pending Approval') {
      return res.status(400).json({ message: 'Task is not pending approval' });
    }

    task.approvalStatus = 'Approved';
    task.approvedBy = hrId;
    task.approvalDate = new Date();
    task.approvalNotes = approvalNotes || 'Approved by HR';

    await task.save();
    await task.populate(['assignedTo', 'createdBy', 'approvedBy']);

    res.json({ message: 'Task approved successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Error approving task', error: error.message });
  }
};

// Reject task completion (HR only)
export const rejectTaskCompletion = async (req, res) => {
  try {
    const { approvalNotes } = req.body;
    const hrId = req.user._id;

    // Verify user is HR
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Only HR can reject tasks' });
    }

    if (!approvalNotes || !approvalNotes.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.approvalStatus !== 'Pending Approval') {
      return res.status(400).json({ message: 'Task is not pending approval' });
    }

    // Send task back to 'In Progress' so employee can fix and resubmit
    task.approvalStatus = 'Rejected';
    task.status = 'In Progress';
    task.approvedBy = hrId;
    task.approvalDate = new Date();
    task.approvalNotes = approvalNotes;

    await task.save();
    await task.populate(['assignedTo', 'createdBy', 'approvedBy']);

    res.json({ message: 'Task rejected with feedback for employee', task });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting task', error: error.message });
  }
};

// Delete task (Manager/Admin)
export const deleteTask = async (req, res) => {
  try {
    // Also delete associated comments
    await TaskComment.deleteMany({ taskId: req.params.id });

    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

// Add comment to task
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const author = req.user._id;

    const comment = new TaskComment({
      taskId: req.params.id,
      author,
      content,
    });

    await comment.save();
    await comment.populate('author', 'name email designation');

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Get task comments
export const getTaskComments = async (req, res) => {
  try {
    const comments = await TaskComment.find({ taskId: req.params.id })
      .populate('author', 'name email designation')
      .sort('-createdAt');

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

// Delete comment (Author or Manager)
export const deleteComment = async (req, res) => {
  try {
    const comment = await TaskComment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author or a manager
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isManager = req.user.role === 'hr' || req.user.role === 'admin';

    if (!isAuthor && !isManager) {
      return res.status(403).json({ message: 'You cannot delete this comment' });
    }

    await TaskComment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Get task statistics/reports for manager
export const getTaskReports = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const filters = {};

    if (employeeId) {
      filters.assignedTo = employeeId;
    }

    const tasks = await Task.find(filters).populate('assignedTo', 'name');

    const report = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'Completed').length,
      pendingTasks: tasks.filter((t) => t.status === 'Pending').length,
      inProgressTasks: tasks.filter((t) => t.status === 'In Progress').length,
      overdueTasks: tasks.filter((t) => t.status === 'Overdue').length,
      completionRate:
        tasks.length > 0
          ? Math.round(
              (tasks.filter((t) => t.status === 'Completed').length / tasks.length) * 100
            )
          : 0,
      byPriority: {
        low: tasks.filter((t) => t.priority === 'Low').length,
        medium: tasks.filter((t) => t.priority === 'Medium').length,
        high: tasks.filter((t) => t.priority === 'High').length,
        critical: tasks.filter((t) => t.priority === 'Critical').length,
      },
      byEmployee: tasks.reduce((acc, task) => {
        task.assignedTo.forEach((emp) => {
          const empId = emp._id.toString();
          if (!acc[empId]) {
            acc[empId] = { employeeName: emp.name, count: 0 };
          }
          acc[empId].count++;
        });
        return acc;
      }, {}),
    };

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task reports', error: error.message });
  }
};

// Auto-update overdue tasks (call periodically or on server startup)
export const checkAndUpdateOverdueTasks = async () => {
  try {
    const now = new Date();
    const result = await Task.updateMany(
      { status: { $ne: 'Completed' }, dueDate: { $lt: now } },
      { status: 'Overdue' }
    );
    console.log(`Updated ${result.modifiedCount} tasks to Overdue status`);
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
  }
};
