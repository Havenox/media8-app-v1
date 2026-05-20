import { api } from '@/lib/api';
import { EditingStyle, CreateEditingStyleRequest, UpdateEditingStyleRequest } from '@/types/services';

// ==========================================
// API FUNCTIONS
// ==========================================

const getAllAPI = async (): Promise<EditingStyle[]> => {
  const response = await api.get('/editing-styles');
  return response.data;
};

const getByIdAPI = async (id: string): Promise<EditingStyle> => {
  const response = await api.get(`/editing-styles/${id}`);
  return response.data;
};

const createAPI = async (data: CreateEditingStyleRequest): Promise<EditingStyle> => {
  const response = await api.post('/editing-styles', data);
  return response.data;
};

const updateAPI = async (id: string, data: UpdateEditingStyleRequest): Promise<EditingStyle> => {
  const response = await api.put(`/editing-styles/${id}`, data);
  return response.data;
};

const deleteAPI = async (id: string): Promise<void> => {
  await api.delete(`/editing-styles/${id}`);
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const editingStyleService = {
  async getAll(): Promise<EditingStyle[]> {
    return getAllAPI();
  },
  async getById(id: string): Promise<EditingStyle> {
    return getByIdAPI(id);
  },
  async create(data: CreateEditingStyleRequest): Promise<EditingStyle> {
    return createAPI(data);
  },
  async update(id: string, data: UpdateEditingStyleRequest): Promise<EditingStyle> {
    return updateAPI(id, data);
  },
  async delete(id: string): Promise<void> {
    return deleteAPI(id);
  },
};

export default editingStyleService;
