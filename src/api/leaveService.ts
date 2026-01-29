import api from './axios';

export interface Leave {
  _id: string;
  employeeId: {
    _id: string;
    employeeId: string;
    name: string;
    email: string;
    department: string;
    designation?: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  hrComments?: string;
  approvedBy?: {
    _id: string;
    employeeId: string;
    name: string;
  };
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveApplication {
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
}

export interface LeaveStats {
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  leaveTypeStats: Array<{
    _id: string;
    count: number;
  }>;
}

export interface LeaveStatusUpdate {
  status: 'Approved' | 'Rejected';
  hrComments?: string;
}

export const leaveService = {
  applyLeave: async (data: LeaveApplication): Promise<Leave> => {
    const response = await api.post<Leave>('/leaves', data);
    return response.data;
  },

  getAllLeaves: async (status?: string): Promise<Leave[]> => {
    const url = status ? `/leaves?status=${status}` : '/leaves';
    const response = await api.get<Leave[]>(url);
    return response.data;
  },

  getMyLeaves: async (): Promise<Leave[]> => {
    const response = await api.get<Leave[]>('/leaves/my-leaves');
    return response.data;
  },

  getLeaveById: async (id: string): Promise<Leave> => {
    const response = await api.get<Leave>(`/leaves/${id}`);
    return response.data;
  },

  updateLeaveStatus: async (id: string, data: LeaveStatusUpdate): Promise<Leave> => {
    const response = await api.put<Leave>(`/leaves/${id}/status`, data);
    return response.data;
  },

  deleteLeave: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/leaves/${id}`);
    return response.data;
  },

  getLeaveStats: async (): Promise<LeaveStats> => {
    const response = await api.get<LeaveStats>('/leaves/stats');
    return response.data;
  },
};
