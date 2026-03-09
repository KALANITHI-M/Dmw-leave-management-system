import express from 'express';
import {
  applyLeave,
  getAllLeaves,
  getMyLeaves,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave,
  getLeaveStats,
  uploadProof,
  uploadProofMiddleware,
} from '../controllers/leaveController.js';
import { protect, hrOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, applyLeave);
router.get('/', protect, hrOnly, getAllLeaves);
router.get('/my-leaves', protect, getMyLeaves);
router.get('/stats', protect, getLeaveStats);
router.get('/:id', protect, getLeaveById);
router.put('/:id/status', protect, hrOnly, updateLeaveStatus);
router.delete('/:id', protect, deleteLeave);
router.post('/:id/proof', protect, uploadProofMiddleware, uploadProof);

export default router;
