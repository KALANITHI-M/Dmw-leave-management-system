import api from './axios';

export interface Shift {
  _id: string;
  name: string;
  startTime: string;   // "HH:MM" 24-hour
  endTime: string;     // "HH:MM" 24-hour
  lateAfterMinutes: number;
  workingHours: number;
  isActive: boolean;
}

export interface EmployeeWithShift {
  _id: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  shift: Shift | null;
}

export interface CreateShiftData {
  name: string;
  startTime: string;
  endTime: string;
  lateAfterMinutes: number;
  workingHours: number;
}

export const shiftService = {
  getAllShifts: async (): Promise<Shift[]> => {
    const { data } = await api.get('/shifts');
    return data;
  },

  createShift: async (shiftData: CreateShiftData): Promise<Shift> => {
    const { data } = await api.post('/shifts', shiftData);
    return data;
  },

  updateShift: async (id: string, shiftData: Partial<CreateShiftData & { isActive: boolean }>): Promise<Shift> => {
    const { data } = await api.put(`/shifts/${id}`, shiftData);
    return data;
  },

  deleteShift: async (id: string): Promise<void> => {
    await api.delete(`/shifts/${id}`);
  },

  getEmployeesWithShifts: async (): Promise<EmployeeWithShift[]> => {
    const { data } = await api.get('/shifts/employees');
    return data;
  },

  assignShift: async (employeeId: string, shiftId: string | null): Promise<EmployeeWithShift> => {
    const { data } = await api.put(`/shifts/assign/${employeeId}`, { shiftId });
    return data;
  },

  getMyShift: async (): Promise<Shift | null> => {
    const { data } = await api.get('/shifts/my-shift');
    return data;
  },
};
