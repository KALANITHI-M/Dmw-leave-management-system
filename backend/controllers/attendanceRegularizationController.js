import AttendanceRegularization from '../models/AttendanceRegularization.js';
import Attendance from '../models/Attendance.js';

// ─── POST /api/attendance-regularization (Employee) ────────────────────────
export const createRequest = async (req, res) => {
  try {
    const { date, requestedCheckIn, requestedCheckOut, reason } = req.body;

    if (!date || !reason?.trim()) {
      return res.status(400).json({ message: 'Date and reason are required' });
    }

    const attDate = new Date(date);
    attDate.setHours(0, 0, 0, 0);
    if (isNaN(attDate.getTime())) return res.status(400).json({ message: 'Invalid date' });

    // Only one pending request per employee per date
    const existing = await AttendanceRegularization.findOne({
      employeeId: req.user._id,
      date: attDate,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({
        message: 'You already have a pending correction request for this date',
      });
    }

    // Build check-in/out Date objects by combining the date with HH:MM time strings
    const buildDateTime = (dayDate, timeStr) => {
      if (!timeStr) return undefined;
      const [h, m] = timeStr.split(':').map(Number);
      const dt = new Date(dayDate);
      dt.setHours(h, m, 0, 0);
      return dt;
    };

    const request = await AttendanceRegularization.create({
      employeeId: req.user._id,
      date: attDate,
      requestedCheckIn: buildDateTime(attDate, requestedCheckIn),
      requestedCheckOut: buildDateTime(attDate, requestedCheckOut),
      reason: reason.trim(),
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/attendance-regularization/my (Employee) ─────────────────────
export const getMyRequests = async (req, res) => {
  try {
    const requests = await AttendanceRegularization.find({ employeeId: req.user._id })
      .populate('reviewedBy', 'name employeeId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/attendance-regularization (HR) ──────────────────────────────
export const getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await AttendanceRegularization.find(filter)
      .populate('employeeId', 'name employeeId department')
      .populate('reviewedBy', 'name employeeId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/attendance-regularization/:id/review (HR) ───────────────────
export const reviewRequest = async (req, res) => {
  try {
    const { status, hrComments } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
    }

    const request = await AttendanceRegularization.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already reviewed' });
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.hrComments = hrComments?.trim() || '';
    await request.save();

    // ── If approved, upsert the attendance record ──────────────────────────
    if (status === 'approved') {
      const attDate = new Date(request.date);
      attDate.setHours(0, 0, 0, 0);

      let attendance = await Attendance.findOne({ employeeId: request.employeeId, date: attDate });
      if (!attendance) {
        attendance = new Attendance({
          employeeId: request.employeeId,
          date: attDate,
          status: 'present',
          workingHours: 0,
        });
      }

      if (request.requestedCheckIn) {
        attendance.checkIn = { time: request.requestedCheckIn, method: 'manual', location: {} };
      }
      if (request.requestedCheckOut) {
        attendance.checkOut = { time: request.requestedCheckOut, method: 'manual', location: {} };
      }
      if (attendance.checkIn?.time && attendance.checkOut?.time) {
        const ms = new Date(attendance.checkOut.time) - new Date(attendance.checkIn.time);
        attendance.workingHours = Math.max(0, Math.round((ms / (1000 * 60 * 60)) * 10) / 10);
      }
      // If previously absent or on-leave, upgrade to present
      if (attendance.status === 'absent' || attendance.status === 'on-leave') {
        attendance.status = 'present';
      }
      await attendance.save();
    }
    // ──────────────────────────────────────────────────────────────────────

    const populated = await AttendanceRegularization.findById(request._id)
      .populate('employeeId', 'name employeeId department')
      .populate('reviewedBy', 'name employeeId');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
