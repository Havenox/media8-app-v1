import { User, UserRole, UserLoginResponse } from '@/types/api';
import { api } from '@/lib/api';

// ==========================================
// API FUNCTIONS
// ==========================================

const getAllAPI = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

const getByIdAPI = async (id: string): Promise<User | null> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

const getByRoleAPI = async (role: UserRole): Promise<User[]> => {
  const response = await api.get(`/users?role=${role}`);
  return response.data;
};

const createAPI = async (data: { name: string; email: string; role: UserRole; password?: string; phone?: string }): Promise<User> => {
  // Use the auth registration endpoint which handles password hashing etc.
  const response = await api.post('/auth/register', {
    ...data,
    password: data.password || 'DefaultPassword123!' // Fallback only if not provided
  });
  return response.data.user;
};

const updateAPI = async (id: string, data: Partial<User>): Promise<User> => {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
};

const deleteAPI = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

const loginAPI = async (email: string, password: string): Promise<UserLoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

const updateProfileAPI = async (id: string, data: any): Promise<User> => {
  const response = await api.put(`/users/${id}/profile`, data);
  return response.data;
};

const changePasswordAPI = async (data: any): Promise<void> => {
  await api.post('/auth/change-password', data);
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const userService = {
  async getAll(): Promise<User[]> {
    return getAllAPI();
  },

  async getById(id: string): Promise<User | null> {
    return getByIdAPI(id);
  },

  async getByEmail(email: string): Promise<User | null> {
    // API would need a specific endpoint or filter
    const users = await getAllAPI();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async getByRole(role: UserRole): Promise<User[]> {
    return getByRoleAPI(role);
  },

  async getClients(): Promise<User[]> {
    return this.getByRole('Client');
  },

  async getEditors(): Promise<User[]> {
    return this.getByRole('Editor');
  },

  async getAdmins(): Promise<User[]> {
    return this.getByRole('Admin');
  },

  async create(data: { name: string; email: string; role: UserRole; password?: string; phone?: string }): Promise<User> {
    return createAPI(data);
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    return updateAPI(id, data);
  },

  async delete(id: string): Promise<void> {
    return deleteAPI(id);
  },

  async login(email: string, password: string): Promise<UserLoginResponse> {
    return loginAPI(email, password);
  },

  async updateProfile(id: string, data: any): Promise<User> {
    return updateProfileAPI(id, data);
  },

  async changePassword(data: any): Promise<void> {
    return changePasswordAPI(data);
  },
};

export default userService;
