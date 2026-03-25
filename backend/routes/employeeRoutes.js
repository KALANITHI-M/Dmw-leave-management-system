import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  createServiceEngineer,
} from '../controllers/employeeController.js';
import { protect, hrOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, hrOnly, getAllEmployees);
router.get('/stats', protect, hrOnly, getEmployeeStats);
router.post('/service-engineer/create', protect, hrOnly, createServiceEngineer);
router.get('/:id', protect, hrOnly, getEmployeeById);
router.put('/:id', protect, hrOnly, updateEmployee);
router.delete('/:id', protect, hrOnly, deleteEmployee);

export default router;
