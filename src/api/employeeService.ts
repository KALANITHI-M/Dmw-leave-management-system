import api from './axios';

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phoneNumber?: string;
  joiningDate?: string;
  role: 'employee' | 'hr';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentStats: Array<{
    _id: string;
    count: number;
  }>;
}

export const employeeService = {
  getAllEmployees: async (): Promise<Employee[]> => {
    const response = await api.get<Employee[]>('/employees');
    return response.data;
  },

  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  updateEmployee: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const response = await api.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/employees/${id}`);
    return response.data;
  },

  getEmployeeStats: async (): Promise<EmployeeStats> => {
    const response = await api.get<EmployeeStats>('/employees/stats');
    return response.data;
  },
};
