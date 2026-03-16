import Task from '../models/Task.js';
import TaskComment from '../models/TaskComment.js';
import Employee from '../models/Employee.js';

// Create a new task (Manager/Admin only)
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, startDate, dueDate } = req.body;
    const createdBy = req.user._id;

    // Validate that all assigned employees exist
    const employees = await Employee.find({ _id: { $in: assignedTo } });
    if (employees.length !== assignedTo.length) {
      return res.status(400).json({ message: 'One or more assigned employees not found' });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      createdBy,
      priority,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
    });

    await task.save();
    await task.populate(['assignedTo', 'createdBy']);

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
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
      .populate('createdBy', 'name email');

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
    const { progress, status } = req.body;
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

    if (status) {
      task.status = status;
      if (status === 'Completed') {
        task.completedDate = new Date();
      }
    }

    await task.save();
    await task.populate(['assignedTo', 'createdBy']);

    res.json({ message: 'Task progress updated', task });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task progress', error: error.message });
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
