import ProfileChangeRequest from '../models/ProfileChangeRequest.js';
import Employee from '../models/Employee.js';

// Create new profile change request
export const createRequest = async (req, res) => {
  try {
    const { employeeId, requestedChanges, currentData } = req.body;

    const request = new ProfileChangeRequest({
      employeeId,
      requestedBy: req.user.id,
      requestedChanges,
      currentData,
      status: 'pending',
    });

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Failed to create request' });
  }
};

// Get all profile change requests (HR only)
export const getAllRequests = async (req, res) => {
  try {
    const requests = await ProfileChangeRequest.find()
      .populate('requestedBy', 'name employeeId')
      .populate('reviewedBy', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

// Get request by ID
export const getRequestById = async (req, res) => {
  try {
    const request = await ProfileChangeRequest.findById(req.params.id)
      .populate('requestedBy', 'name employeeId')
      .populate('reviewedBy', 'name employeeId');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Failed to fetch request' });
  }
};

// Approve request (HR only)
export const approveRequest = async (req, res) => {
  try {
    const { comments } = req.body;
    const request = await ProfileChangeRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already reviewed' });
    }

    // Update employee profile with requested changes
    const employee = await Employee.findById(request.requestedBy);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Apply requested changes
    if (request.requestedChanges.name) employee.name = request.requestedChanges.name;
    if (request.requestedChanges.email) employee.email = request.requestedChanges.email;
    if (request.requestedChanges.department) employee.department = request.requestedChanges.department;
    if (request.requestedChanges.designation) employee.designation = request.requestedChanges.designation;
    if (request.requestedChanges.phoneNumber) employee.phoneNumber = request.requestedChanges.phoneNumber;

    await employee.save();

    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.comments = comments;

    await request.save();

    res.json(request);
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Failed to approve request' });
  }
};

// Reject request (HR only)
export const rejectRequest = async (req, res) => {
  try {
    const { comments } = req.body;
    const request = await ProfileChangeRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already reviewed' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.comments = comments;

    await request.save();

    res.json(request);
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Failed to reject request' });
  }
};

// Get my requests (for employees to see their own requests)
export const getMyRequests = async (req, res) => {
  try {
    const requests = await ProfileChangeRequest.find({ requestedBy: req.user.id })
      .populate('reviewedBy', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};
