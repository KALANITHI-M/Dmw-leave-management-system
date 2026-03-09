import Shift from '../models/Shift.js';
import Employee from '../models/Employee.js';

// ─── GET /api/shifts ────────────────────────────────────────────────────────
export const getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ startTime: 1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/shifts ───────────────────────────────────────────────────────
export const createShift = async (req, res) => {
  try {
    const { name, startTime, endTime, lateAfterMinutes, workingHours } = req.body;
    const shift = await Shift.create({ name, startTime, endTime, lateAfterMinutes, workingHours });
    res.status(201).json(shift);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A shift with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/shifts/:id ────────────────────────────────────────────────────
export const updateShift = async (req, res) => {
  try {
    const { name, startTime, endTime, lateAfterMinutes, workingHours, isActive } = req.body;
    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      { name, startTime, endTime, lateAfterMinutes, workingHours, isActive },
      { new: true, runValidators: true }
    );
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    res.json(shift);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A shift with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/shifts/:id ─────────────────────────────────────────────────
export const deleteShift = async (req, res) => {
  try {
    // Unassign employees on this shift before deleting
    await Employee.updateMany({ shift: req.params.id }, { $set: { shift: null } });
    const deleted = await Shift.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Shift not found' });
    res.json({ message: 'Shift deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/shifts/assign/:employeeId ─────────────────────────────────────
// Body: { shiftId }  (pass null to unassign)
export const assignShift = async (req, res) => {
  try {
    const { shiftId } = req.body;

    if (shiftId) {
      const shift = await Shift.findById(shiftId);
      if (!shift) return res.status(404).json({ message: 'Shift not found' });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.employeeId,
      { shift: shiftId || null },
      { new: true }
    ).populate('shift');

    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/shifts/my-shift ───────────────────────────────────────────────
// Employee: returns their own assigned shift (or null if none)
export const getMyShift = async (req, res) => {
  try {
    const emp = await Employee.findById(req.user._id).populate('shift');
    res.json(emp?.shift ?? null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/shifts/employees ──────────────────────────────────────────────
export const getEmployeesWithShifts = async (req, res) => {
  try {
    const employees = await Employee.find({ role: 'employee' })
      .select('name employeeId department designation shift')
      .populate('shift', 'name startTime endTime')
      .sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
