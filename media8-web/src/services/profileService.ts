import {
  VisualIdentityProfile,
  EditingProfile,
  CreateVisualIdentityProfileRequest,
  UpdateVisualIdentityProfileRequest,
  CreateEditingProfileRequest,
  UpdateEditingProfileRequest,
} from '@/types/profiles';
import { api } from '@/lib/api';

// ==========================================
// VISUAL IDENTITY PROFILE SERVICE
// ==========================================

const VISUAL_BASE = '/api/v1/visual-identity-profiles';

const getVisualByIdAPI = async (id: string): Promise<VisualIdentityProfile> => {
  const response = await api.get(`${VISUAL_BASE}/${id}`);
  return response.data;
};

const createVisualAPI = async (data: CreateVisualIdentityProfileRequest): Promise<VisualIdentityProfile> => {
  const response = await api.post(VISUAL_BASE, data);
  return response.data;
};

const updateVisualAPI = async (id: string, data: UpdateVisualIdentityProfileRequest): Promise<VisualIdentityProfile> => {
  const response = await api.put(`${VISUAL_BASE}/${id}`, data);
  return response.data;
};

const archiveVisualAPI = async (id: string): Promise<void> => {
  await api.delete(`${VISUAL_BASE}/${id}`);
};

const restoreVisualAPI = async (id: string): Promise<void> => {
  await api.post(`${VISUAL_BASE}/${id}/restore`);
};

const hardDeleteVisualAPI = async (id: string): Promise<void> => {
  await api.delete(`${VISUAL_BASE}/${id}/hard-delete`);
};

// ==========================================
// EDITING PROFILE SERVICE
// ==========================================

const EDITING_BASE = '/api/v1/editing-profiles';

const getEditingByIdAPI = async (id: string): Promise<EditingProfile> => {
  const response = await api.get(`${EDITING_BASE}/${id}`);
  return response.data;
};

const createEditingAPI = async (data: CreateEditingProfileRequest): Promise<EditingProfile> => {
  const response = await api.post(EDITING_BASE, data);
  return response.data;
};

const updateEditingAPI = async (id: string, data: UpdateEditingProfileRequest): Promise<EditingProfile> => {
  const response = await api.put(`${EDITING_BASE}/${id}`, data);
  return response.data;
};

const archiveEditingAPI = async (id: string): Promise<void> => {
  await api.delete(`${EDITING_BASE}/${id}`);
};

const restoreEditingAPI = async (id: string): Promise<void> => {
  await api.post(`${EDITING_BASE}/${id}/restore`);
};

const hardDeleteEditingAPI = async (id: string): Promise<void> => {
  await api.delete(`${EDITING_BASE}/${id}/hard-delete`);
};

// ==========================================
// EXPORTED SERVICES
// ==========================================

export const visualIdentityProfileService = {
  async getAll(onlyActive: boolean = true): Promise<VisualIdentityProfile[]> {
    const response = await api.get(VISUAL_BASE, { params: { onlyActive } });
    return response.data;
  },

  async getById(id: string): Promise<VisualIdentityProfile> {
    return getVisualByIdAPI(id);
  },

  async create(data: CreateVisualIdentityProfileRequest): Promise<VisualIdentityProfile> {
    return createVisualAPI(data);
  },

  async update(id: string, data: UpdateVisualIdentityProfileRequest): Promise<VisualIdentityProfile> {
    return updateVisualAPI(id, data);
  },

  async archive(id: string): Promise<void> {
    return archiveVisualAPI(id);
  },

  async restore(id: string): Promise<void> {
    return restoreVisualAPI(id);
  },

  async hardDelete(id: string): Promise<void> {
    return hardDeleteVisualAPI(id);
  },
};

export const editingProfileService = {
  async getAll(onlyActive: boolean = true): Promise<EditingProfile[]> {
    const response = await api.get(EDITING_BASE, { params: { onlyActive } });
    return response.data;
  },

  async getById(id: string): Promise<EditingProfile> {
    return getEditingByIdAPI(id);
  },

  async create(data: CreateEditingProfileRequest): Promise<EditingProfile> {
    return createEditingAPI(data);
  },

  async update(id: string, data: UpdateEditingProfileRequest): Promise<EditingProfile> {
    return updateEditingAPI(id, data);
  },

  async archive(id: string): Promise<void> {
    return archiveEditingAPI(id);
  },

  async restore(id: string): Promise<void> {
    return restoreEditingAPI(id);
  },

  async hardDelete(id: string): Promise<void> {
    return hardDeleteEditingAPI(id);
  },
};
