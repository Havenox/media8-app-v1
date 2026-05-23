import {
  BrandingProfile,
  EditingProfile,
  CreateBrandingProfileRequest,
  UpdateBrandingProfileRequest,
  CreateEditingProfileRequest,
  UpdateEditingProfileRequest,
} from '@/types/brandingProfiles';
import { api } from '@/lib/api';

// ==========================================
// BRANDING PROFILE SERVICE (formerly Visual Identity Profile)
// ==========================================

const BRANDING_BASE = '/BrandingProfiles';

const getBrandingByIdAPI = async (id: string): Promise<BrandingProfile> => {
  const response = await api.get(`${BRANDING_BASE}/${id}`);
  return response.data;
};

const createBrandingAPI = async (data: CreateBrandingProfileRequest): Promise<BrandingProfile> => {
  const response = await api.post(BRANDING_BASE, data);
  return response.data;
};

const updateBrandingAPI = async (id: string, data: UpdateBrandingProfileRequest): Promise<BrandingProfile> => {
  const response = await api.put(`${BRANDING_BASE}/${id}`, data);
  return response.data;
};

const archiveBrandingAPI = async (id: string): Promise<void> => {
  await api.delete(`${BRANDING_BASE}/${id}`);
};

const restoreBrandingAPI = async (id: string): Promise<void> => {
  await api.post(`${BRANDING_BASE}/${id}/restore`);
};

const hardDeleteBrandingAPI = async (id: string): Promise<void> => {
  await api.delete(`${BRANDING_BASE}/${id}/hard-delete`);
};

// ==========================================
// EDITING PROFILE SERVICE
// ==========================================

const EDITING_BASE = '/EditingProfiles';

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

export const brandingProfileService = {
  async getAll(onlyActive: boolean = true): Promise<BrandingProfile[]> {
    const response = await api.get(BRANDING_BASE, { params: { onlyActive } });
    return response.data;
  },

  async getById(id: string): Promise<BrandingProfile> {
    return getBrandingByIdAPI(id);
  },

  async create(data: CreateBrandingProfileRequest): Promise<BrandingProfile> {
    return createBrandingAPI(data);
  },

  async update(id: string, data: UpdateBrandingProfileRequest): Promise<BrandingProfile> {
    return updateBrandingAPI(id, data);
  },

  async archive(id: string): Promise<void> {
    return archiveBrandingAPI(id);
  },

  async restore(id: string): Promise<void> {
    return restoreBrandingAPI(id);
  },

  async hardDelete(id: string): Promise<void> {
    return hardDeleteBrandingAPI(id);
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
