export interface User {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phoneNumber?: string;
  joiningDate?: string;
  role: 'employee' | 'hr';
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  employeeId: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  designation: string;
  phoneNumber: string;
  joiningDate: string;
}

export interface AuthResponse {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phoneNumber?: string;
  role: 'employee' | 'hr';
  token: string;
}

export interface ApiError {
  message: string;
}