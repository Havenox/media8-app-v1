import { Offer, CreateOfferRequest, UpdateOfferRequest, OfferResponse } from '@/types/offers';
import { api } from '@/lib/api';

// ==========================================
// API FUNCTIONS
// ==========================================

const getAllAPI = async (page = 1, pageSize = 20, search?: string): Promise<OfferResponse[]> => {
  const query = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (search) {
    query.append('search', search);
  }

  const response = await api.get(`/offers?${query.toString()}`);
  return response.data;
};

const getByIdAPI = async (id: string): Promise<OfferResponse | null> => {
  const response = await api.get(`/offers/${id}`);
  return response.data;
};

const createAPI = async (data: CreateOfferRequest): Promise<OfferResponse> => {
  const response = await api.post('/offers', data);
  return response.data;
};

const updateAPI = async (id: string, data: UpdateOfferRequest): Promise<OfferResponse> => {
  const response = await api.put(`/offers/${id}`, data);
  return response.data;
};

const deleteAPI = async (id: string, permanent = false): Promise<void> => {
  const params = new URLSearchParams({ permanent: permanent.toString() });
  await api.delete(`/offers/${id}?${params.toString()}`);
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const offerService = {
  async getAll(page?: number, pageSize?: number, search?: string): Promise<OfferResponse[]> {
    return getAllAPI(page, pageSize, search);
  },

  async getById(id: string): Promise<OfferResponse | null> {
    return getByIdAPI(id);
  },

  async create(data: CreateOfferRequest): Promise<OfferResponse> {
    return createAPI(data);
  },

  async update(id: string, data: UpdateOfferRequest): Promise<OfferResponse> {
    return updateAPI(id, data);
  },

  async delete(id: string, permanent = false): Promise<void> {
    return deleteAPI(id, permanent);
  },
};

// State reset function (for testing/demo purposes)
export const resetOffersState = () => {
  // No-op for API-based service (kept for consistency with resetAllDemoData)
};

export default offerService;
