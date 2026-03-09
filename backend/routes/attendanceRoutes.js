import express from 'express';
import { protect, hrOnly } from '../middleware/auth.js';
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getDailyAttendance,
  getMonthlySummary,
  generateQRToken,
  getQRToken,
  triggerMarkAbsent,
  adminUpdateAttendance,
} from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/my', protect, getMyAttendance);
router.get('/daily', protect, hrOnly, getDailyAttendance);
router.get('/monthly-summary', protect, hrOnly, getMonthlySummary);
router.post('/qr-token', protect, hrOnly, generateQRToken);
router.get('/qr-token', protect, hrOnly, getQRToken);
router.post('/mark-absent', protect, hrOnly, triggerMarkAbsent);
router.put('/admin', protect, hrOnly, adminUpdateAttendance);

export default router;
