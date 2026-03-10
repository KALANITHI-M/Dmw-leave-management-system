import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Attendance from '../models/Attendance.js';
import { initLeaveBalance } from './leaveBalanceController.js';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store file in memory, then stream to Cloudinary manually for full control
const memStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, PDF files are allowed'));
  }
};

export const uploadProofMiddleware = multer({ storage: memStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('proof');

// Upload buffer to Cloudinary and return secure URL
const uploadToCloudinary = (buffer, mimetype) =>
  new Promise((resolve, reject) => {
    const isPdf = mimetype === 'application/pdf';
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'leave-proofs',
        resource_type: isPdf ? 'raw' : 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });

// POST /api/leaves/:id/proof  (Employee — upload proof for a leave)
export const uploadProof = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    if (leave.employeeId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const secureUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    leave.proofUrl = secureUrl;
    await leave.save();
    res.json({ proofUrl: leave.proofUrl });
  } catch (error) {
    console.error('Proof upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Apply for leave (Employee)
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;

    // ── Server-side validation of numberOfDays ─────────────────────────────
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    if (isNaN(sDate) || isNaN(eDate)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    if (sDate > eDate) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }
    const calendarDays = Math.round((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
    const clientDays = parseFloat(numberOfDays);
    if (!clientDays || clientDays < 0.5 || clientDays > calendarDays) {
      return res.status(400).json({
        message: `Invalid number of days. Must be between 0.5 and ${calendarDays} for the selected date range.`,
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    // ── Duplicate / overlap check ──────────────────────────────────────────
    // Block if the employee already has a Pending or Approved leave that
    // overlaps the requested date range. Only rejected leaves are ignored.
    const overlapping = await Leave.findOne({
      employeeId: req.user._id,
      status: { $in: ['Pending', 'Approved'] },
      startDate: { $lte: eDate },
      endDate:   { $gte: sDate },
    });
    if (overlapping) {
      const overlapStatus = overlapping.status.toLowerCase();
      return res.status(400).json({
        message: `You already have a ${overlapStatus} leave request for this date range (${new Date(overlapping.startDate).toLocaleDateString('en-GB')} – ${new Date(overlapping.endDate).toLocaleDateString('en-GB')}). You can only apply again if it is rejected by HR.`,
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    // ── Balance check ──────────────────────────────────────────────────────
    const year = new Date(startDate).getFullYear();
    let balance = await LeaveBalance.findOne({ employeeId: req.user._id, year });
    if (!balance) balance = await initLeaveBalance(req.user._id, year);

    const entry = balance.balances.find((b) => b.leaveType === leaveType);
    if (!entry) return res.status(400).json({ message: 'Invalid leave type' });

    const remaining = entry.allocated - entry.used - entry.pending;
    if (remaining < numberOfDays) {
      return res.status(400).json({
        message: `Insufficient leave balance. You have ${remaining} day(s) remaining for ${leaveType}.`,
        remainingBalance: remaining,
      });
    }

    // Reserve as pending
    entry.pending = Math.round((entry.pending + numberOfDays) * 2) / 2;
    await balance.save();
    // ───────────────────────────────────────────────────────────────────────

    const leave = await Leave.create({
      employeeId: req.user._id,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      status: 'Pending',
    });

    const populatedLeave = await Leave.findById(leave._id).populate('employeeId', 'name employeeId email department');

    res.status(201).json(populatedLeave);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get all leaves (HR only)
export const getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name employeeId email department designation')
      .populate('approvedBy', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get employee's own leaves
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.user._id })
      .populate('approvedBy', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get single leave by ID
export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'name employeeId email department designation')
      .populate('approvedBy', 'name employeeId');

    if (leave) {
      // Check if user has permission to view this leave
      if (req.user.role === 'hr' || leave.employeeId._id.toString() === req.user._id.toString()) {
        res.json(leave);
      } else {
        res.status(403).json({ message: 'Not authorized to view this leave' });
      }
    } else {
      res.status(404).json({ message: 'Leave not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Update leave status (HR only)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, hrComments } = req.body;

    const leave = await Leave.findById(req.params.id);

    if (leave) {
      const prevStatus = leave.status;
      leave.status = status;
      leave.hrComments = hrComments || leave.hrComments;

      if (status === 'Approved' || status === 'Rejected') {
        leave.approvedBy = req.user._id;
        leave.approvedDate = new Date();
      }

      const updatedLeave = await leave.save();

      // ── Balance update ────────────────────────────────────────────────────
      if (prevStatus === 'Pending') {
        const year = new Date(leave.startDate).getFullYear();
        const balance = await LeaveBalance.findOne({ employeeId: leave.employeeId, year });
        if (balance) {
          const entry = balance.balances.find((b) => b.leaveType === leave.leaveType);
          if (entry) {
            // Remove from pending in all cases
            entry.pending = Math.max(0, Math.round((entry.pending - leave.numberOfDays) * 2) / 2);
            if (status === 'Approved') {
              // Deduct from annual allocation
              entry.used = Math.round((entry.used + leave.numberOfDays) * 2) / 2;
            }
            await balance.save();
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      // ── Create on-leave attendance records for each working day ────────────
      if (status === 'Approved') {
        const start = new Date(leave.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(leave.endDate);
        end.setHours(0, 0, 0, 0);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const day = d.getDay();
          if (day === 0 || day === 6) continue; // skip weekends
          const dateKey = new Date(d);
          await Attendance.findOneAndUpdate(
            { employeeId: leave.employeeId, date: dateKey },
            { $setOnInsert: { employeeId: leave.employeeId, date: dateKey, status: 'on-leave', workingHours: 0 } },
            { upsert: true }
          );
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      const populatedLeave = await Leave.findById(updatedLeave._id)
        .populate('employeeId', 'name employeeId email department')
        .populate('approvedBy', 'name employeeId');

      res.json(populatedLeave);
    } else {
      res.status(404).json({ message: 'Leave not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Delete leave
export const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (leave) {
      // Only allow deletion if pending and by the employee who created it or HR
      if (leave.status === 'Pending' && (leave.employeeId.toString() === req.user._id.toString() || req.user.role === 'hr')) {
        // Restore pending balance before deleting
        const year = new Date(leave.startDate).getFullYear();
        const balance = await LeaveBalance.findOne({ employeeId: leave.employeeId, year });
        if (balance) {
          const entry = balance.balances.find((b) => b.leaveType === leave.leaveType);
          if (entry) {
            entry.pending = Math.max(0, Math.round((entry.pending - leave.numberOfDays) * 2) / 2);
            await balance.save();
          }
        }

        await Leave.deleteOne({ _id: req.params.id });
        res.json({ message: 'Leave application deleted successfully' });
      } else {
        res.status(403).json({ message: 'Cannot delete this leave application' });
      }
    } else {
      res.status(404).json({ message: 'Leave not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get leave statistics
export const getLeaveStats = async (req, res) => {
  try {
    let query = {};
    
    // If employee, show only their stats
    if (req.user.role === 'employee') {
      query.employeeId = req.user._id;
    }

    const totalLeaves = await Leave.countDocuments(query);
    const pendingLeaves = await Leave.countDocuments({ ...query, status: 'Pending' });
    const approvedLeaves = await Leave.countDocuments({ ...query, status: 'Approved' });
    const rejectedLeaves = await Leave.countDocuments({ ...query, status: 'Rejected' });

    // Get leave type statistics
    const leaveTypeStats = await Leave.aggregate([
      { $match: query },
      { $group: { _id: '$leaveType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      leaveTypeStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
