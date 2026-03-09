import cron from 'node-cron';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';

/**
 * Returns today's date at midnight (00:00:00.000) in local time.
 */
const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Core logic — can be called by the cron job or the manual HR endpoint.
 * Inserts absent records for every active employee who has no attendance
 * entry for the given date (defaults to today). Skips weekends.
 *
 * Returns { marked: number, date: string }
 */
export const markAbsentEmployees = async (targetDate = todayMidnight()) => {
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { marked: 0, skipped: 'weekend', date: targetDate.toISOString().split('T')[0] };
  }

  // Fetch all active employees (exclude HR users — they are not subject to attendance tracking)
  const employees = await Employee.find({ isActive: true, role: 'employee' }).select('_id').lean();

  // Find employees who have an approved leave covering targetDate — they must not be marked absent
  const approvedLeaves = await Leave.find({
    status: 'Approved',
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate },
  }).select('employeeId').lean();
  const onLeaveIds = new Set(approvedLeaves.map((l) => l.employeeId.toString()));

  // Find which employees already have a record for the target date
  const existing = await Attendance.find({ date: targetDate }).select('employeeId').lean();
  const checkedInIds = new Set(existing.map((a) => a.employeeId.toString()));

  // Build absent documents for those who don't have a record and are not on approved leave
  const absentDocs = employees
    .filter((emp) => !checkedInIds.has(emp._id.toString()) && !onLeaveIds.has(emp._id.toString()))
    .map((emp) => ({
      employeeId: emp._id,
      date: targetDate,
      status: 'absent',
      workingHours: 0,
    }));

  if (absentDocs.length > 0) {
    // insertMany with ordered:false so one duplicate (race condition) won't abort the rest
    await Attendance.insertMany(absentDocs, { ordered: false }).catch((err) => {
      // Ignore duplicate key errors (E11000) — employee already checked in between query and insert
      if (err.code !== 11000 && err.name !== 'BulkWriteError') throw err;
    });
  }

  console.log(
    `[AbsentJob] ${targetDate.toDateString()} — marked ${absentDocs.length} employee(s) as absent`
  );

  return {
    marked: absentDocs.length,
    date: targetDate.toISOString().split('T')[0],
  };
};

/**
 * Schedules the absent-marking job.
 * Runs at 23:59 every day (Mon–Fri) server time.
 * Call this once from server.js after DB connects.
 */
export const startAbsentCronJob = () => {
  // "59 23 * * 1-5"  →  23:59, Monday through Friday
  cron.schedule('59 23 * * 1-5', async () => {
    console.log('[AbsentJob] Running end-of-day absent check…');
    try {
      const result = await markAbsentEmployees();
      console.log(`[AbsentJob] Done — ${result.marked} absent record(s) inserted`);
    } catch (error) {
      console.error('[AbsentJob] Error:', error.message);
    }
  });

  console.log('[AbsentJob] Scheduled — runs at 23:59 Mon–Fri');
};
