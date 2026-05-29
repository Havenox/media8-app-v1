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

// PascalCase: Backend usa /ClientContracts
const getAllAPI = async (clientId?: string): Promise<ClientContractResponse[]> => {
const query = new URLSearchParams();

if (clientId) {
query.append('clientId', clientId);
}

const response = await api.get(`/ClientContracts?${query.toString()}`);
return response.data;
};

const getByIdAPI = async (id: string): Promise<ClientContractResponse | null> => {
const response = await api.get(`/ClientContracts/${id}`);
return response.data;
};

const createAPI = async (data: CreateClientContractRequest): Promise<ClientContractResponse> => {
const response = await api.post('/ClientContracts', data);
return response.data;
};

const updateAPI = async (
  id: string,
  data: UpdateClientContractRequest
): Promise<ClientContractResponse> => {
  const response = await api.put(`/ClientContracts/${id}`, data);
  return response.data;
};

const getMyContractsAPI = async (showArchived: boolean = false): Promise<ClientContractResponse[]> => {
  const response = await api.get(`/ClientContracts/my?showArchived=${showArchived}`);
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
  async getAll(clientId?: string): Promise<ClientContractResponse[]> {
    return getAllAPI(clientId);
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

  async getMyContracts(showArchived: boolean = false): Promise<ClientContractResponse[]> {
    return getMyContractsAPI(showArchived);
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
