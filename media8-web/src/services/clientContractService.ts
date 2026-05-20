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

const getAllAPI = async (clientId?: string): Promise<ClientContractResponse[]> => {
  const query = new URLSearchParams();

  if (clientId) {
    query.append('clientId', clientId);
  }

  const response = await api.get(`/client-contracts?${query.toString()}`);
  return response.data;
};

const getByIdAPI = async (id: string): Promise<ClientContractResponse | null> => {
  const response = await api.get(`/client-contracts/${id}`);
  return response.data;
};

const createAPI = async (data: CreateClientContractRequest): Promise<ClientContractResponse> => {
  const response = await api.post('/client-contracts', data);
  return response.data;
};

const updateAPI = async (
  id: string,
  data: UpdateClientContractRequest
): Promise<ClientContractResponse> => {
  const response = await api.put(`/client-contracts/${id}`, data);
  return response.data;
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
};

// State reset function (for testing/demo purposes)
export const resetClientContractsState = () => {
  // No-op for API-based service (kept for consistency with resetAllDemoData)
};

export default clientContractService;
