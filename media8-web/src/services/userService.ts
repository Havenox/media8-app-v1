import { User, UserRole, UserLoginResponse } from '@/types/api';
import { api } from '@/lib/api';

// ==========================================
// API FUNCTIONS
// ==========================================

// ==========================================
// API FUNCTIONS
// ==========================================

const getAllAPI = async (page = 1, pageSize = 20, role?: UserRole, search?: string, showInactive = false): Promise<User[]> => {
  const query = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (role) {
    query.append('role', role);
  }

  if (search) {
    query.append('search', search);
  }

  if (showInactive) {
    query.append('showInactive', 'true');
  }

  const response = await api.get(`/users?${query.toString()}`);
  return response.data;
};

const getByIdAPI = async (id: string): Promise<User | null> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

const getByRoleAPI = async (role: UserRole): Promise<User[]> => {
  return getAllAPI(1, 1000, role); // Backwards compatibility for role helpers
};

const createAPI = async (data: { name: string; email: string; role: UserRole; password?: string; phone?: string }): Promise<User> => {
  // Use the admin create endpoint
  const response = await api.post('/users', {
    ...data,
    password: data.password || 'MudaSenha123!' // Default password if empty (should check frontend validation)
  });
  return response.data;
};

const updateAPI = async (id: string, data: Partial<User>): Promise<User> => {
  // Use PUT for Admin Update
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

const deleteAPI = async (id: string): Promise<{ success: boolean; message: string; deletedPhysically: boolean }> => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

const reactivateAPI = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.put(`/users/${id}/reactivate`);
  return response.data;
};

// ... existing auth methods ...
const loginAPI = async (email: string, password: string): Promise<UserLoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

const updateProfileAPI = async (id: string, data: any): Promise<User> => {
  const response = await api.put(`/users/${id}/profile`, data);
  return response.data;
};

const changePasswordAPI = async (data: any): Promise<void> => {
  const response = await api.post('/auth/change-password', data);
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const userService = {
  async getAll(page?: number, pageSize?: number, role?: UserRole, search?: string): Promise<User[]> {
    return getAllAPI(page, pageSize, role, search);
  },

  async getById(id: string): Promise<User | null> {
    return getByIdAPI(id);
  },

  async getByEmail(email: string): Promise<User | null> {
    // API would need a specific endpoint or filter
    // For now we can't reliably filter by email on paged list without backend support
    return null;
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

  async getStats(): Promise<import('@/types/api').UserStats> {
    const response = await api.get('/users/stats');
    return response.data;
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

async reactivate(id: string): Promise<{ success: boolean; message: string }> {
  return reactivateAPI(id);
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
