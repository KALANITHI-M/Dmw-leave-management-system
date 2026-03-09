import api from './axios';

export interface RegularizationRequest {
  _id: string;
  employeeId:
    | { _id: string; name: string; employeeId: string; department: string }
    | string;
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: { _id: string; name: string; employeeId: string };
  reviewedAt?: string;
  hrComments?: string;
  createdAt: string;
}

export const regularizationService = {
  createRequest: async (data: {
    date: string;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason: string;
  }): Promise<RegularizationRequest> => {
    const response = await api.post<RegularizationRequest>('/attendance-regularization', data);
    return response.data;
  },

  getMyRequests: async (): Promise<RegularizationRequest[]> => {
    const response = await api.get<RegularizationRequest[]>('/attendance-regularization/my');
    return response.data;
  },

  getAllRequests: async (status?: string): Promise<RegularizationRequest[]> => {
    const url = status
      ? `/attendance-regularization?status=${status}`
      : '/attendance-regularization';
    const response = await api.get<RegularizationRequest[]>(url);
    return response.data;
  },

  reviewRequest: async (
    id: string,
    data: { status: 'approved' | 'rejected'; hrComments?: string }
  ): Promise<RegularizationRequest> => {
    const response = await api.put<RegularizationRequest>(
      `/attendance-regularization/${id}/review`,
      data
    );
    return response.data;
  },
};
