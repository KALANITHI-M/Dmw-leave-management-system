import api from './axios';

export interface Location {
  lat?: number;
  lng?: number;
  address?: string;
}

export interface CheckInData {
  time: string;
  location: Location;
  method: 'gps' | 'qr' | 'manual';
}

export interface Attendance {
  _id: string;
  employeeId:
    | { _id: string; name: string; employeeId: string; department: string }
    | string;
  date: string;
  checkIn?: CheckInData;
  checkOut?: CheckInData;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'on-leave';
  workingHours?: number;
  createdAt: string;
}

export interface DailyRecord {
  employee: {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
    designation?: string;
  };
  attendance: Attendance | null;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'on-leave';
}

export interface MonthlySummary {
  _id: string;
  name: string;
  employeeId: string;
  department: string;
  present: number;
  late: number;
  halfDay: number;
  onLeave: number;
  absent: number;
  totalWorkingHours: number;
  daysRecorded: number;
}

export interface QRToken {
  _id: string;
  token: string;
  date: string;
  expiresAt: string;
}

export interface CheckInRequest {
  location?: Location;
  method: 'gps' | 'qr' | 'manual';
  qrToken?: string;
}

export const attendanceService = {
  checkIn: async (data: CheckInRequest): Promise<Attendance> => {
    const response = await api.post<Attendance>('/attendance/check-in', data);
    return response.data;
  },

  checkOut: async (data: {
    location?: Location;
    method: 'gps' | 'qr' | 'manual';
  }): Promise<Attendance> => {
    const response = await api.post<Attendance>('/attendance/check-out', data);
    return response.data;
  },

  getTodayAttendance: async (): Promise<Attendance | null> => {
    const response = await api.get<Attendance | null>('/attendance/today');
    return response.data;
  },

  getMyAttendance: async (month?: number, year?: number): Promise<Attendance[]> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const response = await api.get<Attendance[]>(`/attendance/my?${params}`);
    return response.data;
  },

  getDailyAttendance: async (date?: string): Promise<DailyRecord[]> => {
    const url = date ? `/attendance/daily?date=${date}` : '/attendance/daily';
    const response = await api.get<DailyRecord[]>(url);
    return response.data;
  },

  getMonthlySummary: async (month?: number, year?: number): Promise<MonthlySummary[]> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const response = await api.get<MonthlySummary[]>(`/attendance/monthly-summary?${params}`);
    return response.data;
  },

  generateQRToken: async (): Promise<QRToken> => {
    const response = await api.post<QRToken>('/attendance/qr-token', {});
    return response.data;
  },

  getQRToken: async (): Promise<QRToken | null> => {
    const response = await api.get<QRToken | null>('/attendance/qr-token');
    return response.data;
  },

  markAbsent: async (date?: string): Promise<{ marked: number; date: string; skipped?: string }> => {
    const response = await api.post('/attendance/mark-absent', date ? { date } : {});
    return response.data;
  },

  adminUpdateAttendance: async (data: {
    employeeId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status?: string;
  }): Promise<Attendance> => {
    const response = await api.put<Attendance>('/attendance/admin', data);
    return response.data;
  },
};
