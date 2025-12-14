import { Order, OrderStatus, CreateOrderRequest } from '@/types/api';
import { ServiceType } from '@/types/services';
import { api } from '@/lib/api';

// ==========================================
// API FUNCTIONS
// ==========================================

interface CreateOrderData extends CreateOrderRequest {
  clientId: string;
  serviceType?: ServiceType;
}

const getAllAPI = async (): Promise<Order[]> => {
  const response = await api.get('/orders');
  return response.data;
};

const getByIdAPI = async (id: string): Promise<Order | null> => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

const getByClientAPI = async (clientId: string): Promise<Order[]> => {
  const response = await api.get(`/orders?clientId=${clientId}`);
  return response.data;
};

const getByEditorAPI = async (editorId: string): Promise<Order[]> => {
  const response = await api.get(`/orders?editorId=${editorId}`);
  return response.data;
};

const getByStatusAPI = async (status: OrderStatus): Promise<Order[]> => {
  const response = await api.get(`/orders?status=${status}`);
  return response.data;
};

const createAPI = async (data: CreateOrderData): Promise<Order> => {
  const response = await api.post('/orders', data);
  return response.data;
};

const updateAPI = async (id: string, data: Partial<Order>): Promise<Order> => {
  const response = await api.patch(`/orders/${id}`, data);
  return response.data;
};

const deleteAPI = async (id: string): Promise<void> => {
  await api.delete(`/orders/${id}`);
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const orderService = {
  async getAll(): Promise<Order[]> {
    return getAllAPI();
  },

  async getById(id: string): Promise<Order | null> {
    return getByIdAPI(id);
  },

  async getByClient(clientId: string): Promise<Order[]> {
    return getByClientAPI(clientId);
  },

  async getByEditor(editorId: string): Promise<Order[]> {
    return getByEditorAPI(editorId);
  },

  async getByStatus(status: OrderStatus): Promise<Order[]> {
    return getByStatusAPI(status);
  },

  async create(data: CreateOrderData): Promise<Order> {
    return createAPI(data);
  },

  async update(id: string, data: Partial<Order>): Promise<Order> {
    return updateAPI(id, data);
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return updateAPI(id, { status });
  },

  async assignEditor(id: string, editorId: string): Promise<Order> {
    return updateAPI(id, { editorId });
  },

  async delete(id: string): Promise<void> {
    return deleteAPI(id);
  },

  // Helper: Get stats for dashboard
  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    inReview: number;
    approved: number;
  }> {
    const orders = await this.getAll();
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      inProgress: orders.filter(o => o.status === 'InProgress').length,
      inReview: orders.filter(o => o.status === 'InReview').length,
      approved: orders.filter(o => o.status === 'Approved').length,
    };
  },
};

export default orderService;
