import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createServiceTicket,
  getServiceTickets,
  getServiceTicketById,
  assignServiceTicket,
  updateTicketStatus,
  uploadProofOfWork,
  addTicketComment,
  getTicketStatistics,
  rejectResolution,
  deleteTicketComment,
  uploadFileMiddleware,
  uploadProofMiddleware,
} from '../controllers/serviceTicketController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Ticket creation (with file uploads)
router.post('/', uploadFileMiddleware, createServiceTicket);

// Get ticket statistics (specific route BEFORE generic routes)
router.get('/statistics/dashboard', getTicketStatistics);

// Get all tickets (with role-based filtering)
router.get('/', getServiceTickets);

// Get ticket by ID
router.get('/:id', getServiceTicketById);

// Assign ticket (Admin/Manager only)
router.post('/:id/assign', assignServiceTicket);

// Update ticket status
router.put('/:id/status', updateTicketStatus);

// Upload proof of work
router.post('/:id/upload-proof', uploadProofMiddleware, uploadProofOfWork);

// Reject resolution (Admin/Manager only)
router.post('/:id/reject-resolution', rejectResolution);

// Add comment
router.post('/:id/comments', addTicketComment);

// Delete comment
router.delete('/:id/comments/:commentId', deleteTicketComment);

export default router;
