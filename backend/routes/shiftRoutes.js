import express from 'express';
import { protect, hrOnly } from '../middleware/auth.js';
import {
  getAllShifts,
  createShift,
  updateShift,
  deleteShift,
  assignShift,
  getEmployeesWithShifts,
  getMyShift,
} from '../controllers/shiftController.js';

const router = express.Router();

router.get('/', protect, hrOnly, getAllShifts);
router.post('/', protect, hrOnly, createShift);
router.get('/my-shift', protect, getMyShift);        // employee: view own shift
router.put('/assign/:employeeId', protect, hrOnly, assignShift);
router.get('/employees', protect, hrOnly, getEmployeesWithShifts);
router.put('/:id', protect, hrOnly, updateShift);
router.delete('/:id', protect, hrOnly, deleteShift);

export default router;
