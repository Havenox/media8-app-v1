import { VideoFormat } from '@/types/api';
import { api } from '@/lib/api';

// ==========================================
// TYPES
// ==========================================

export interface CreateVideoFormatRequest {
  name: string;
  slug: string;
  maxDurationSeconds: number;
  tier: 'Standard' | 'Premium' | 'GodMode';
}

export interface UpdateVideoFormatRequest {
  name?: string;
  slug?: string;
  maxDurationSeconds?: number;
  tier?: 'Standard' | 'Premium' | 'GodMode';
  isActive?: boolean;
}

// ==========================================
// API FUNCTIONS
// ==========================================

const getAllAPI = async (): Promise<VideoFormat[]> => {
  const response = await api.get('/video-formats');
  return response.data;
};

const getByIdAPI = async (id: string): Promise<VideoFormat | null> => {
  const response = await api.get(`/video-formats/${id}`);
  return response.data;
};

const createAPI = async (data: CreateVideoFormatRequest): Promise<VideoFormat> => {
  const response = await api.post('/video-formats', data);
  return response.data;
};

const updateAPI = async (id: string, data: UpdateVideoFormatRequest): Promise<VideoFormat> => {
  const response = await api.put(`/video-formats/${id}`, data);
  return response.data;
};

const deleteAPI = async (id: string, permanent = false): Promise<void> => {
  const params = new URLSearchParams({ permanent: permanent.toString() });
  await api.delete(`/video-formats/${id}?${params.toString()}`);
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const videoFormatService = {
  async getAll(): Promise<VideoFormat[]> {
    return getAllAPI();
  },

  async getById(id: string): Promise<VideoFormat | null> {
    return getByIdAPI(id);
  },

  async create(data: CreateVideoFormatRequest): Promise<VideoFormat> {
    return createAPI(data);
  },

  async update(id: string, data: UpdateVideoFormatRequest): Promise<VideoFormat> {
    return updateAPI(id, data);
  },

  async delete(id: string, permanent = false): Promise<void> {
    return deleteAPI(id, permanent);
  },
};

export default videoFormatService;
