import {
  ClientContract,
  CreateClientContractRequest,
  UpdateClientContractRequest,
  ClientContractResponse,
} from '@/types/offers';
import { api } from '@/lib/api';

// ==========================================
// API FUNCTIONS
// ==========================================

// PascalCase: Backend usa /ClientContracts e /admin/ClientContracts
const getAllAPI = async (page = 1, pageSize = 10, clientId?: string): Promise<ClientContractResponse[]> => {
  const query = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (clientId) {
    query.append('clientId', clientId);
  }

  const response = await api.get(`/admin/ClientContracts?${query.toString()}`);
  return response.data;
};

const getByIdAPI = async (id: string): Promise<ClientContractResponse | null> => {
  const response = await api.get(`/ClientContracts/${id}`);
  return response.data;
};

const createAPI = async (data: CreateClientContractRequest): Promise<ClientContractResponse> => {
  const response = await api.post('/admin/ClientContracts', data);
  return response.data;
};

const updateAPI = async (
  id: string,
  data: UpdateClientContractRequest
): Promise<ClientContractResponse> => {
  const response = await api.put(`/admin/ClientContracts/${id}`, data);
  return response.data;
};

const getMyContractsAPI = async (page = 1, pageSize = 10, showArchived: boolean = false): Promise<ClientContractResponse[]> => {
  const query = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    showArchived: showArchived.toString(),
  });
  const response = await api.get(`/ClientContracts/my?${query.toString()}`);
  return response.data;
};

const archiveAPI = async (id: string): Promise<void> => {
  await api.post(`/ClientContracts/${id}/archive`);
};

const unarchiveAPI = async (id: string): Promise<void> => {
  await api.post(`/ClientContracts/${id}/unarchive`);
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const clientContractService = {
  async getAll(page = 1, pageSize = 10, clientId?: string): Promise<ClientContractResponse[]> {
    return getAllAPI(page, pageSize, clientId);
  },

  async getById(id: string): Promise<ClientContractResponse | null> {
    return getByIdAPI(id);
  },

  async create(data: CreateClientContractRequest): Promise<ClientContractResponse> {
    return createAPI(data);
  },

  async update(
    id: string,
    data: UpdateClientContractRequest
  ): Promise<ClientContractResponse> {
    return updateAPI(id, data);
  },

  async getMyContracts(page = 1, pageSize = 10, showArchived: boolean = false): Promise<ClientContractResponse[]> {
    return getMyContractsAPI(page, pageSize, showArchived);
  },

  async archive(id: string): Promise<void> {
    return archiveAPI(id);
  },

  async unarchive(id: string): Promise<void> {
    return unarchiveAPI(id);
  },
};

// State reset function (for testing/demo purposes)
export const resetClientContractsState = () => {
  // No-op for API-based service (kept for consistency with resetAllDemoData)
};

export default clientContractService;
