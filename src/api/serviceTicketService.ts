import axiosInstance from './axios';

const SERVICE_TICKETS_API = '/service-tickets';

export const serviceTicketService = {
  // Create a new service ticket
  createTicket: async (ticketData: FormData) => {
    const response = await axiosInstance.post(`${SERVICE_TICKETS_API}`, ticketData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all service tickets with filtering
  getTickets: async (filters: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    sortBy?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.category) params.append('category', filters.category);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const response = await axiosInstance.get(
      `${SERVICE_TICKETS_API}?${params.toString()}`
    );
    return response.data;
  },

  // Get ticket by ID
  getTicketById: async (ticketId: string) => {
    const response = await axiosInstance.get(`${SERVICE_TICKETS_API}/${ticketId}`);
    return response.data;
  },

  // Assign ticket to engineer
  assignTicket: async (ticketId: string, assignedTo: string) => {
    const response = await axiosInstance.post(
      `${SERVICE_TICKETS_API}/${ticketId}/assign`,
      { assignedTo }
    );
    return response.data;
  },

  // Update ticket status
  updateTicketStatus: async (
    ticketId: string,
    newStatus: string,
    resolutionNotes?: string
  ) => {
    const response = await axiosInstance.put(
      `${SERVICE_TICKETS_API}/${ticketId}/status`,
      { newStatus, resolutionNotes }
    );
    return response.data;
  },

  // Upload proof of work
  uploadProofOfWork: async (ticketId: string, formData: FormData) => {
    const response = await axiosInstance.post(
      `${SERVICE_TICKETS_API}/${ticketId}/upload-proof`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Add comment to ticket
  addComment: async (ticketId: string, content: string, isInternal?: boolean) => {
    const response = await axiosInstance.post(
      `${SERVICE_TICKETS_API}/${ticketId}/comments`,
      { content, isInternal }
    );
    return response.data;
  },

  // Delete comment
  deleteComment: async (ticketId: string, commentId: string) => {
    const response = await axiosInstance.delete(
      `${SERVICE_TICKETS_API}/${ticketId}/comments/${commentId}`
    );
    return response.data;
  },

  // Get ticket statistics
  getStatistics: async () => {
    const response = await axiosInstance.get(`${SERVICE_TICKETS_API}/statistics/dashboard`);
    return response.data;
  },

  // Reject resolution
  rejectResolution: async (ticketId: string, rejectionReason: string) => {
    const response = await axiosInstance.post(
      `${SERVICE_TICKETS_API}/${ticketId}/reject-resolution`,
      { rejectionReason }
    );
    return response.data;
  },
};
