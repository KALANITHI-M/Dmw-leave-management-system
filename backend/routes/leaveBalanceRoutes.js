import express from 'express';
import {
  getMyBalance,
  getAllBalances,
  getEmployeeBalance,
  updateAllocated,
} from '../controllers/leaveBalanceController.js';
import { protect, hrOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMyBalance);
router.get('/', protect, hrOnly, getAllBalances);
router.get('/:empId', protect, hrOnly, getEmployeeBalance);
router.put('/:id', protect, hrOnly, updateAllocated);

export default router;
