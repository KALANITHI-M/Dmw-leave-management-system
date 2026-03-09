import crypto from 'crypto';
import Attendance from '../models/Attendance.js';
import QRToken from '../models/QRToken.js';
import Employee from '../models/Employee.js';

// ─── Helper ────────────────────────────────────────────────────────────────
const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWorkingDays = (year, month) => {
  let count = 0;
  const days = new Date(year, month, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
};

// Haversine formula — returns distance in metres between two lat/lng points
const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── POST /api/attendance/check-in ─────────────────────────────────────────
export const checkIn = async (req, res) => {
  try {
    const { location, method, qrToken } = req.body;
    const today = todayMidnight();

    const existing = await Attendance.findOne({ employeeId: req.user._id, date: today });
    if (existing) {
      return res.status(400).json({ message: 'You have already checked in today' });
    }

    // ── Geofence check for GPS check-in ───────────────────────────────────
    if (method === 'gps') {
      if (!location?.lat || !location?.lng) {
        return res.status(400).json({
          message: 'GPS location is required for check-in. Please enable location access.',
        });
      }

      const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
      const officeLng = parseFloat(process.env.OFFICE_LONGITUDE);
      const allowedRadius = parseFloat(process.env.OFFICE_RADIUS_METERS) || 500;

      if (isNaN(officeLat) || isNaN(officeLng)) {
        return res.status(500).json({
          message: 'Office location is not configured on the server. Please contact your administrator.',
        });
      }

      const distanceMeters = haversineMeters(
        location.lat,
        location.lng,
        officeLat,
        officeLng
      );

      if (distanceMeters > allowedRadius) {
        return res.status(403).json({
          message: `You are ${Math.round(distanceMeters)} m away from the office. You must be within ${allowedRadius} m of ${process.env.OFFICE_NAME} to check in via GPS.`,
          distanceMeters: Math.round(distanceMeters),
          allowedRadius,
        });
      }
    }

    // ── QR token verification ──────────────────────────────────────────────
    if (method === 'qr') {
      const tokenDoc = await QRToken.findOne({ date: today });
      if (!tokenDoc || tokenDoc.token !== qrToken) {
        return res.status(400).json({ message: 'Invalid or expired QR code' });
      }
    }

    // ── Block employees from using manual check-in ─────────────────────────
    if (method === 'manual' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Manual check-in is not allowed for employees' });
    }

    const now = new Date();

    // ── Shift-aware late check ─────────────────────────────────────────────
    const emp = await Employee.findById(req.user._id).populate('shift');
    let lateThresholdMins = 9 * 60 + 30; // default 09:30
    if (emp?.shift) {
      const [sh, sm] = emp.shift.startTime.split(':').map(Number);
      lateThresholdMins = sh * 60 + sm + (emp.shift.lateAfterMinutes ?? 30);
    }
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const isLate = nowMins > lateThresholdMins;

    const attendance = await Attendance.create({
      employeeId: req.user._id,
      date: today,
      checkIn: { time: now, location: location || {}, method: method || 'gps' },
      status: isLate ? 'late' : 'present',
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/attendance/check-out ────────────────────────────────────────
export const checkOut = async (req, res) => {
  try {
    const { location, method } = req.body;
    const today = todayMidnight();

    const attendance = await Attendance.findOne({ employeeId: req.user._id, date: today });
    if (!attendance) {
      return res.status(400).json({ message: 'You have not checked in today' });
    }
    if (attendance.checkOut?.time) {
      return res.status(400).json({ message: 'You have already checked out today' });
    }

    const now = new Date();
    const workingMs = now - attendance.checkIn.time;
    const workingHours = Math.round((workingMs / (1000 * 60 * 60)) * 10) / 10;

    // Shift-aware half-day threshold
    const emp = await Employee.findById(req.user._id).populate('shift');
    const halfDayHours = emp?.shift ? emp.shift.workingHours / 2 : 4.5;

    if (workingHours < halfDayHours && (attendance.status === 'present' || attendance.status === 'late')) {
      attendance.status = 'half-day';
    }

    attendance.checkOut = { time: now, location: location || {}, method: method || 'gps' };
    attendance.workingHours = workingHours;
    await attendance.save();

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/attendance/today ─────────────────────────────────────────────
export const getTodayAttendance = async (req, res) => {
  try {
    const today = todayMidnight();
    const attendance = await Attendance.findOne({ employeeId: req.user._id, date: today });
    res.json(attendance || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/attendance/my?month=&year= ───────────────────────────────────
export const getMyAttendance = async (req, res) => {
  try {
    const y = parseInt(req.query.year) || new Date().getFullYear();
    const m = parseInt(req.query.month) || new Date().getMonth() + 1;
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const records = await Attendance.find({
      employeeId: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/attendance/daily?date= (HR only) ─────────────────────────────
export const getDailyAttendance = async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const allEmployees = await Employee.find({ role: 'employee' })
      .select('name employeeId department designation');

    const records = await Attendance.find({ date })
      .populate('employeeId', 'name employeeId department');

    const result = allEmployees.map((emp) => {
      const att = records.find((r) => {
        const attEmpId =
          typeof r.employeeId === 'object' ? r.employeeId._id?.toString() : r.employeeId?.toString();
        return attEmpId === emp._id.toString();
      });
      return { employee: emp, attendance: att || null, status: att ? att.status : 'absent' };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/attendance/monthly-summary?month=&year= (HR only) ────────────
export const getMonthlySummary = async (req, res) => {
  try {
    const y = parseInt(req.query.year) || new Date().getFullYear();
    const m = parseInt(req.query.month) || new Date().getMonth() + 1;
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);
    const workingDaysInMonth = getWorkingDays(y, m);

    const summary = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$employeeId',
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } },
          onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on-leave'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          totalWorkingHours: { $sum: '$workingHours' },
          daysRecorded: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'emp',
        },
      },
      { $unwind: '$emp' },
      {
        $project: {
          name: '$emp.name',
          employeeId: '$emp.employeeId',
          department: '$emp.department',
          present: 1,
          late: 1,
          halfDay: 1,
          onLeave: 1,
          absent: 1,
          totalWorkingHours: { $round: ['$totalWorkingHours', 1] },
          daysRecorded: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/attendance/qr-token (HR only) ──────────────────────────────
export const generateQRToken = async (req, res) => {
  try {
    const today = todayMidnight();
    const expiresAt = new Date(today);
    expiresAt.setHours(23, 59, 59, 999);

    const token = crypto.randomUUID();

    const existing = await QRToken.findOne({ date: today });
    if (existing) {
      existing.token = token;
      existing.createdBy = req.user._id;
      existing.expiresAt = expiresAt;
      await existing.save();
      return res.json(existing);
    }

    const tokenDoc = await QRToken.create({
      token,
      date: today,
      createdBy: req.user._id,
      expiresAt,
    });

    res.status(201).json(tokenDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/attendance/qr-token (HR only) ───────────────────────────────
export const getQRToken = async (req, res) => {
  try {
    const today = todayMidnight();
    const tokenDoc = await QRToken.findOne({ date: today });
    res.json(tokenDoc || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/attendance/admin (HR only) ───────────────────────────────────
// Upsert (create or update) an attendance record for any employee on any date
export const adminUpdateAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status } = req.body;
    const validStatuses = ['present', 'late', 'absent', 'half-day', 'on-leave'];

    if (!employeeId || !date) {
      return res.status(400).json({ message: 'employeeId and date are required' });
    }
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const attDate = new Date(date);
    attDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ employeeId, date: attDate });
    if (!attendance) {
      attendance = new Attendance({ employeeId, date: attDate, status: status || 'present', workingHours: 0 });
    }

    if (checkInTime) {
      const [h, m] = checkInTime.split(':').map(Number);
      const t = new Date(attDate);
      t.setHours(h, m, 0, 0);
      attendance.checkIn = { time: t, method: 'manual', location: {} };
    }
    if (checkOutTime) {
      const [h, m] = checkOutTime.split(':').map(Number);
      const t = new Date(attDate);
      t.setHours(h, m, 0, 0);
      attendance.checkOut = { time: t, method: 'manual', location: {} };
    }
    if (status) attendance.status = status;

    if (attendance.checkIn?.time && attendance.checkOut?.time) {
      const ms = new Date(attendance.checkOut.time) - new Date(attendance.checkIn.time);
      attendance.workingHours = Math.max(0, Math.round((ms / (1000 * 60 * 60)) * 10) / 10);
    }

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/attendance/mark-absent (HR only) ────────────────────────────
// Manually trigger the absent-marking logic for a given date (defaults today)
export const triggerMarkAbsent = async (req, res) => {
  try {
    const { markAbsentEmployees } = await import('../utils/markAbsentJob.js');
    const targetDate = req.body.date ? new Date(req.body.date) : todayMidnight();
    targetDate.setHours(0, 0, 0, 0);
    const result = await markAbsentEmployees(targetDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
