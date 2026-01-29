import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';

// Apply for leave (Employee)
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;

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
      leave.status = status;
      leave.hrComments = hrComments || leave.hrComments;
      
      if (status === 'Approved' || status === 'Rejected') {
        leave.approvedBy = req.user._id;
        leave.approvedDate = new Date();
      }

      const updatedLeave = await leave.save();
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
