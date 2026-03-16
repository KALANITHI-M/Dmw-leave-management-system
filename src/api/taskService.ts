import axiosInstance from './axios';

const TASKS_API = '/api/tasks';

interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  createdBy?: string;
  sortBy?: string;
}

interface TaskData {
  title: string;
  description: string;
  assignedTo: string[];
  priority: string;
  startDate: string;
  dueDate: string;
}

export const taskService = {
  // Create a new task (Manager/Admin only)
  createTask: async (taskData: TaskData) => {
    const response = await axiosInstance.post(`${TASKS_API}`, taskData);
    return response.data;
  },

  // Get all tasks with filtering
  getTasks: async (filters: TaskFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.createdBy) params.append('createdBy', filters.createdBy);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const response = await axiosInstance.get(`${TASKS_API}?${params.toString()}`);
    return response.data;
  },

  // Get tasks assigned to current employee
  getMyTasks: async (filters: TaskFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const response = await axiosInstance.get(`${TASKS_API}/my-tasks?${params.toString()}`);
    return response.data;
  },

  // Get task by ID
  getTaskById: async (taskId: string) => {
    const response = await axiosInstance.get(`${TASKS_API}/${taskId}`);
    return response.data;
  },

  // Update task (Manager/Admin only)
  updateTask: async (taskId: string, updates: Partial<TaskData>) => {
    const response = await axiosInstance.put(`${TASKS_API}/${taskId}`, updates);
    return response.data;
  },

  // Update task progress (Employee can update their own task progress)
  updateTaskProgress: async (taskId: string, progress: number, status: string) => {
    const response = await axiosInstance.put(`${TASKS_API}/${taskId}/progress`, {
      progress,
      status,
    });
    return response.data;
  },

  // Delete task (Manager/Admin only)
  deleteTask: async (taskId: string) => {
    const response = await axiosInstance.delete(`${TASKS_API}/${taskId}`);
    return response.data;
  },

  // Add comment to task
  addComment: async (taskId: string, content: string) => {
    const response = await axiosInstance.post(`${TASKS_API}/${taskId}/comments`, {
      content,
    });
    return response.data;
  },

  // Get task comments
  getTaskComments: async (taskId: string) => {
    const response = await axiosInstance.get(`${TASKS_API}/${taskId}/comments`);
    return response.data;
  },

  // Delete comment
  deleteComment: async (taskId: string, commentId: string) => {
    const response = await axiosInstance.delete(`${TASKS_API}/${taskId}/comments/${commentId}`);
    return response.data;
  },

  // Get task reports (Manager/Admin only)
  getTaskReports: async (employeeId: string | null = null) => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);

    const response = await axiosInstance.get(`${TASKS_API}/reports?${params.toString()}`);
    return response.data;
  },
};
