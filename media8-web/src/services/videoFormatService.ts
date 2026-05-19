import { VideoFormat } from '@/types/api';
import { api } from '@/lib/api';

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
};

export default videoFormatService;
