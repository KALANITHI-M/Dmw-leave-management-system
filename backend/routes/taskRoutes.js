import express from 'express';
import {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  updateTaskProgress,
  submitTaskForApproval,
  approveTaskCompletion,
  rejectTaskCompletion,
  deleteTask,
  addComment,
  getTaskComments,
  deleteComment,
  getTaskReports,
  uploadCompletionProof,
  uploadProofMiddleware,
} from '../controllers/taskController.js';
import { protect, hrOnly } from '../middleware/auth.js';

const router = express.Router();

// Task CRUD operations
router.post('/', protect, hrOnly, createTask); // Only HR/Manager can create tasks
router.get('/', protect, getTasks); // Get all tasks (with filters)
router.get('/my-tasks', protect, getMyTasks); // Get tasks assigned to current employee
router.get('/reports', protect, hrOnly, getTaskReports); // Get task reports (HR only)
router.get('/:id', protect, getTaskById); // Get task details
router.put('/:id', protect, hrOnly, updateTask); // Update task (HR only)
router.delete('/:id', protect, hrOnly, deleteTask); // Delete task (HR only)

// Task progress update (employees can update their own task progress)
router.put('/:id/progress', protect, updateTaskProgress);

// Task approval workflow
router.post('/:id/submit-for-approval', protect, submitTaskForApproval); // Employee submits completed task for approval
router.post('/:id/approve', protect, hrOnly, approveTaskCompletion); // HR approves task completion
router.post('/:id/reject', protect, hrOnly, rejectTaskCompletion); // HR rejects task completion with feedback

// Upload completion proof (photo/screenshot only)
router.post('/:id/upload-proof', protect, uploadProofMiddleware, uploadCompletionProof);

// Task comments
router.post('/:id/comments', protect, addComment); // Add comment to task
router.get('/:id/comments', protect, getTaskComments); // Get task comments
router.delete('/:id/comments/:commentId', protect, deleteComment); // Delete comment

export default router;
