import ServiceTicket from '../models/ServiceTicket.js';
import ServiceTicketComment from '../models/ServiceTicketComment.js';
import ServiceTicketActivity from '../models/ServiceTicketActivity.js';
import Employee from '../models/Employee.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File storage setup
const memStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|docx|doc|xlsx|xls/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, PDF, DOCX, and Excel files are allowed'));
  }
};

export const uploadFileMiddleware = multer({
  storage: memStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).array('attachments', 5);

export const uploadProofMiddleware = multer({
  storage: memStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array('proofFiles', 5);

// Upload file to Cloudinary
const uploadToCloudinary = (buffer, mimetype, filename) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'service-tickets',
        resource_type: 'auto',
        public_id: filename,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });

// Log activity
const logActivity = async (ticketId, performedBy, action, actionDetails, oldValue = null, newValue = null) => {
  try {
    await ServiceTicketActivity.create({
      ticket: ticketId,
      performedBy,
      action,
      actionDetails,
      oldValue,
      newValue,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Validate status transition
const isValidStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'Open': ['Assigned', 'On Hold'],
    'Assigned': ['In Progress', 'On Hold'],
    'In Progress': ['Resolved', 'On Hold', 'Reopened'],
    'Resolved': ['Closed', 'Reopened'],
    'On Hold': ['Assigned', 'In Progress'],
    'Reopened': ['Assigned', 'In Progress', 'On Hold'],
    'Closed': [], // Final status
  };

  return validTransitions[currentStatus] && validTransitions[currentStatus].includes(newStatus);
};

// Create service ticket (Employee/User)
export const createServiceTicket = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;
    const createdBy = req.user._id;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Ticket title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Ticket description is required' });
    }
    if (!priority) {
      return res.status(400).json({ message: 'Priority level is required' });
    }

    // Process file attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
        const filename = `${Date.now()}-${file.originalname}`;

        const url = await uploadToCloudinary(file.buffer, file.mimetype, filename);
        attachments.push({
          filename: file.originalname,
          url,
          fileType: fileExt,
          fileSize: file.size,
        });
      }
    }

    // Create ticket
    const ticket = new ServiceTicket({
      title: title.trim(),
      description: description.trim(),
      priority,
      category: category || 'Other',
      createdBy,
      attachments,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    await ticket.save();
    await ticket.populate(['createdBy', 'assignedTo']);

    // Log activity
    await logActivity(ticket._id, createdBy, 'created', `Ticket created: ${title}`);

    res.status(201).json({ message: 'Service ticket created successfully', ticket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Error creating ticket', error: error.message });
  }
};

// Get all tickets (with role-based filtering)
export const getServiceTickets = async (req, res) => {
  try {
    const { status, priority, category, assignedTo, sortBy = '-createdAt' } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    const filters = {};

    // Role-based filtering
    if (userRole === 'service engineer') {
      // Service engineers see only their assigned tickets
      filters.assignedTo = userId;
    } else if (userRole === 'employee') {
      // Employees see only their created tickets and assigned tickets
      filters.$or = [
        { createdBy: userId },
        { assignedTo: userId },
      ];
    }
    // HR staff see all tickets

    // Additional filters
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (assignedTo && userRole === 'hr') {
      filters.assignedTo = assignedTo;
    }

    const tickets = await ServiceTicket.find(filters)
      .populate('createdBy', 'name email designation')
      .populate('assignedTo', 'name email designation')
      .populate('closedBy', 'name email')
      .sort(sortBy)
      .lean();

    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
};

// Get ticket by ID
export const getServiceTicketById = async (req, res) => {
  try {
    const ticket = await ServiceTicket.findById(req.params.id)
      .populate('createdBy', 'name email designation')
      .populate('assignedTo', 'name email designation')
      .populate('closedBy', 'name email')
      .populate('proofOfWork.uploadedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Fetch comments
    const comments = await ServiceTicketComment.find({ ticket: req.params.id })
      .populate('createdBy', 'name email designation')
      .sort('-createdAt');

    // Fetch activity log
    const activities = await ServiceTicketActivity.find({ ticket: req.params.id })
      .populate('performedBy', 'name email')
      .sort('-createdAt');

    res.json({ ticket, comments, activities });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Error fetching ticket', error: error.message });
  }
};

// Assign ticket (HR only)
export const assignServiceTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const ticketId = req.params.id;

    // Validate permissions
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Only HR staff can assign tickets' });
    }

    const ticket = await ServiceTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Validate assigned service engineer exists
    const engineer = await Employee.findById(assignedTo);
    if (!engineer || engineer.role !== 'service engineer') {
      return res.status(400).json({ message: 'Invalid service engineer selected' });
    }

    const oldAssignee = ticket.assignedTo;
    ticket.assignedTo = assignedTo;
    
    // Update status to Assigned if it's Open
    if (ticket.status === 'Open') {
      ticket.status = 'Assigned';
    }

    await ticket.save();
    await ticket.populate(['createdBy', 'assignedTo']);

    // Log activity
    const actionDetails = oldAssignee
      ? `Ticket reassigned from ${oldAssignee} to ${engineer.name}`
      : `Ticket assigned to ${engineer.name}`;

    await logActivity(ticketId, req.user._id, oldAssignee ? 'reassigned' : 'assigned', actionDetails, oldAssignee, assignedTo);

    res.json({ message: 'Ticket assigned successfully', ticket });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ message: 'Error assigning ticket', error: error.message });
  }
};

// Update ticket status (with validation)
export const updateTicketStatus = async (req, res) => {
  try {
    const { newStatus, resolutionNotes } = req.body;
    const ticketId = req.params.id;
    const userId = req.user._id;

    const ticket = await ServiceTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Permission checks
    if (ticket.assignedTo && ticket.assignedTo.toString() !== userId.toString() && req.user.role === 'service engineer') {
      return res.status(403).json({ message: 'You are not assigned to this ticket' });
    }

    // Only HR staff can close tickets
    if (newStatus === 'Closed' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Only HR staff can close tickets' });
    }

    // Validate status transition
    if (!isValidStatusTransition(ticket.status, newStatus)) {
      return res.status(400).json({
        message: `Cannot transition from ${ticket.status} to ${newStatus}`,
      });
    }

    // Ensure proof is uploaded before marking as Resolved
    if (newStatus === 'Resolved' && ticket.proofOfWork.length === 0) {
      return res.status(400).json({
        message: 'At least one proof file must be uploaded before marking ticket as Resolved',
      });
    }

    const oldStatus = ticket.status;
    ticket.status = newStatus;

    if (newStatus === 'Resolved') {
      ticket.resolvedDate = new Date();
      if (resolutionNotes) {
        ticket.resolutionNotes = resolutionNotes;
      }
    }

    if (newStatus === 'Closed') {
      ticket.closedDate = new Date();
      ticket.closedBy = userId;
      if (resolutionNotes) {
        ticket.closureNotes = resolutionNotes;
      }
    }

    if (newStatus === 'In Progress') {
      // Set due date to 24 hours from now if not already set
      if (!ticket.dueDate) {
        const dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + 24);
        ticket.dueDate = dueDate;
      }
    }

    await ticket.save();
    await ticket.populate(['createdBy', 'assignedTo', 'closedBy']);

    // Log activity
    await logActivity(ticketId, userId, 'status_changed', `Status changed from ${oldStatus} to ${newStatus}`, oldStatus, newStatus);

    res.json({ message: `Ticket status updated to ${newStatus}`, ticket });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ message: 'Error updating ticket status', error: error.message });
  }
};

// Upload proof of work (Engineer only)
export const uploadProofOfWork = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user._id;

    const ticket = await ServiceTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Permission check
    if (ticket.assignedTo.toString() !== userId.toString() && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'You are not authorized to upload proof for this ticket' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Upload files
    for (const file of req.files) {
      const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
      const filename = `proof-${Date.now()}-${file.originalname}`;
      const { description } = req.body;

      const url = await uploadToCloudinary(file.buffer, file.mimetype, filename);

      ticket.proofOfWork.push({
        filename: file.originalname,
        url,
        fileType: fileExt,
        fileSize: file.size,
        uploadedBy: userId,
        description: description || '',
      });
    }

    await ticket.save();
    await ticket.populate(['createdBy', 'assignedTo', 'proofOfWork.uploadedBy']);

    // Log activity
    await logActivity(ticketId, userId, 'proof_uploaded', `Uploaded ${req.files.length} proof file(s)`);

    res.json({ message: 'Proof of work uploaded successfully', ticket });
  } catch (error) {
    console.error('Error uploading proof:', error);
    res.status(500).json({ message: 'Error uploading proof', error: error.message });
  }
};

// Add comment to ticket
export const addTicketComment = async (req, res) => {
  try {
    const { content, isInternal } = req.body;
    const ticketId = req.params.id;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    // Internal comments restricted to HR staff
    if (isInternal && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Only HR staff can add internal comments' });
    }

    const comment = new ServiceTicketComment({
      ticket: ticketId,
      createdBy: userId,
      content: content.trim(),
      isInternal: isInternal || false,
    });

    await comment.save();
    await comment.populate('createdBy', 'name email designation');

    // Log activity
    await logActivity(ticketId, userId, 'comment_added', `Comment added to ticket`);

    res.json({ message: 'Comment added successfully', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Get dashboard statistics
export const getTicketStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let filters = {};

    if (userRole === 'service engineer') {
      filters.assignedTo = userId;
    } else if (userRole === 'employee') {
      filters.createdBy = userId;
    }

    const statistics = {
      total: await ServiceTicket.countDocuments(filters),
      open: await ServiceTicket.countDocuments({ ...filters, status: 'Open' }),
      assigned: await ServiceTicket.countDocuments({ ...filters, status: 'Assigned' }),
      inProgress: await ServiceTicket.countDocuments({ ...filters, status: 'In Progress' }),
      resolved: await ServiceTicket.countDocuments({ ...filters, status: 'Resolved' }),
      closed: await ServiceTicket.countDocuments({ ...filters, status: 'Closed' }),
      highPriority: await ServiceTicket.countDocuments({ ...filters, priority: 'High' }),
      criticalPriority: await ServiceTicket.countDocuments({ ...filters, priority: 'Critical' }),
    };

    res.json({ statistics });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

// Reject resolution (HR only)
export const rejectResolution = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const ticketId = req.params.id;

    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Only HR staff can reject resolutions' });
    }

    const ticket = await ServiceTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status !== 'Resolved') {
      return res.status(400).json({ message: 'Only resolved tickets can be rejected' });
    }

    ticket.status = 'In Progress';
    ticket.resolvedDate = null;
    ticket.resolutionNotes = null;

    await ticket.save();
    await ticket.populate(['createdBy', 'assignedTo']);

    // Log activity
    await logActivity(ticketId, req.user._id, 'resolution_rejected', `Resolution rejected: ${rejectionReason || 'No reason provided'}`);

    res.json({ message: 'Resolution rejected successfully', ticket });
  } catch (error) {
    console.error('Error rejecting resolution:', error);
    res.status(500).json({ message: 'Error rejecting resolution', error: error.message });
  }
};

// Delete comment (only by creator or admin/manager)
export const deleteTicketComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await ServiceTicketComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Permission check
    if (comment.createdBy.toString() !== userId.toString() && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'You cannot delete this comment' });
    }

    await ServiceTicketComment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};
