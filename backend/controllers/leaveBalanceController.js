import LeaveBalance from '../models/LeaveBalance.js';
import { LEAVE_TYPES, LEAVE_POLICY } from '../config/leavePolicy.js';

// ─── Helper (also used by leaveController & authController) ─────────────────
export const initLeaveBalance = async (employeeId, year) => {
  const existing = await LeaveBalance.findOne({ employeeId, year });
  if (existing) return existing;

  const balances = LEAVE_TYPES.map((type) => ({
    leaveType: type,
    allocated: LEAVE_POLICY[type].perYear,
    used: 0,
    pending: 0,
  }));

  return await LeaveBalance.create({ employeeId, year, balances });
};

// GET /api/leave-balance/me  (employee)
export const getMyBalance = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    let balance = await LeaveBalance.findOne({ employeeId: req.user._id, year });
    if (!balance) balance = await initLeaveBalance(req.user._id, year);
    res.json(balance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leave-balance  (HR only — all employees)
export const getAllBalances = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const balances = await LeaveBalance.find({ year }).populate(
      'employeeId',
      'name employeeId department designation'
    );
    res.json(balances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leave-balance/:empId  (HR only — single employee)
export const getEmployeeBalance = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    let balance = await LeaveBalance.findOne({ employeeId: req.params.empId, year });
    if (!balance) balance = await initLeaveBalance(req.params.empId, year);
    res.json(balance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/leave-balance/:id  (HR only — override allocated days for one type)
export const updateAllocated = async (req, res) => {
  try {
    const { leaveType, allocated } = req.body;
    const balance = await LeaveBalance.findById(req.params.id);
    if (!balance) return res.status(404).json({ message: 'Balance record not found' });

    const entry = balance.balances.find((b) => b.leaveType === leaveType);
    if (!entry) return res.status(400).json({ message: 'Invalid leave type' });

    entry.allocated = Number(allocated);
    await balance.save();
    res.json(balance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
