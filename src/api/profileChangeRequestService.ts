import api from './axios';

export interface ProfileChangeRequest {
  _id?: string;
  employeeId: string;
  requestedBy: string;
  requestedChanges: {
    name?: string;
    email?: string;
    department?: string;
    designation?: string;
    phoneNumber?: string;
  };
  currentData: {
    name: string;
    email: string;
    department: string;
    designation: string;
    phoneNumber?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const profileChangeRequestService = {
  createRequest: async (data: Omit<ProfileChangeRequest, '_id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ProfileChangeRequest> => {
    const response = await api.post<ProfileChangeRequest>('/profile-change-requests', data);
    return response.data;
  },

  getAllRequests: async (): Promise<ProfileChangeRequest[]> => {
    const response = await api.get<ProfileChangeRequest[]>('/profile-change-requests');
    return response.data;
  },

  getRequestById: async (id: string): Promise<ProfileChangeRequest> => {
    const response = await api.get<ProfileChangeRequest>(`/profile-change-requests/${id}`);
    return response.data;
  },

  approveRequest: async (id: string, comments?: string): Promise<ProfileChangeRequest> => {
    const response = await api.put<ProfileChangeRequest>(`/profile-change-requests/${id}/approve`, { comments });
    return response.data;
  },

  rejectRequest: async (id: string, comments?: string): Promise<ProfileChangeRequest> => {
    const response = await api.put<ProfileChangeRequest>(`/profile-change-requests/${id}/reject`, { comments });
    return response.data;
  },

  getMyRequests: async (): Promise<ProfileChangeRequest[]> => {
    const response = await api.get<ProfileChangeRequest[]>('/profile-change-requests/my-requests');
    return response.data;
  },
};
