import express from 'express';
import { protect, hrOnly } from '../middleware/auth.js';
import {
  createRequest,
  getMyRequests,
  getAllRequests,
  reviewRequest,
} from '../controllers/attendanceRegularizationController.js';

const router = express.Router();

router.post('/', protect, createRequest);
router.get('/my', protect, getMyRequests);
router.get('/', protect, hrOnly, getAllRequests);
router.put('/:id/review', protect, hrOnly, reviewRequest);

export default router;
