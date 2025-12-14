import { Package, CreatePackageRequest, PackageCategory } from '@/types/packages';
import { api } from '@/lib/api';

// ==========================================
// API FUNCTIONS
// ==========================================

const getAllAPI = async (): Promise<Package[]> => {
  const response = await api.get('/packages');
  return response.data;
};

const getActiveAPI = async (): Promise<Package[]> => {
  const response = await api.get('/packages?active=true');
  return response.data;
};

const getByIdAPI = async (id: string): Promise<Package | null> => {
  const response = await api.get(`/packages/${id}`);
  return response.data;
};

const getByCategoryAPI = async (category: PackageCategory): Promise<Package[]> => {
  const response = await api.get(`/packages?category=${category}`);
  return response.data;
};

const createAPI = async (data: CreatePackageRequest): Promise<Package> => {
  const response = await api.post('/packages', data);
  return response.data;
};

const updateAPI = async (id: string, data: Partial<Package>): Promise<Package> => {
  const response = await api.put(`/packages/${id}`, data);
  return response.data;
};

const deleteAPI = async (id: string): Promise<void> => {
  await api.delete(`/packages/${id}`);
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const packageService = {
  async getAll(): Promise<Package[]> {
    return getAllAPI();
  },

  async getActive(): Promise<Package[]> {
    return getActiveAPI();
  },

  async getById(id: string): Promise<Package | null> {
    return getByIdAPI(id);
  },

  async getByCategory(category: PackageCategory): Promise<Package[]> {
    return getByCategoryAPI(category);
  },

  async create(data: CreatePackageRequest): Promise<Package> {
    return createAPI(data);
  },

  async update(id: string, data: Partial<Package>): Promise<Package> {
    return updateAPI(id, data);
  },

  async toggleVisibility(id: string): Promise<Package> {
    // For API, get current status and toggle
    const pkg = await getByIdAPI(id);
    if (!pkg) throw new Error('Pacote não encontrado');
    return updateAPI(id, { isPublic: !pkg.isPublic });
  },

  async delete(id: string): Promise<void> {
    return deleteAPI(id);
  },
};

export default packageService;
