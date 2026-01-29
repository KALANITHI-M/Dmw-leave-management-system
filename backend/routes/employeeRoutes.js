import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from '../controllers/employeeController.js';
import { protect, hrOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, hrOnly, getAllEmployees);
router.get('/stats', protect, hrOnly, getEmployeeStats);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, hrOnly, updateEmployee);
router.delete('/:id', protect, hrOnly, deleteEmployee);

export default router;
