import { Order, OrderStatus, CreateOrderRequest, ServiceBalanceLot } from '@/types/api';
import { api } from '@/lib/api';

export interface SystemSettingsResponse {
  settings: Record<string, string>;
}

// ==========================================
// API FUNCTIONS
// ==========================================

interface CreateOrderData extends CreateOrderRequest {
  clientId: string;
  videoFormatId?: string; // FK dinâmica para VideoFormat
  serviceBalanceLotId: string;
}

// PascalCase: Backend usa /Orders
const getAllAPI = async (): Promise<Order[]> => {
  const response = await api.get('/Orders');
  return response.data;
};

const getByIdAPI = async (id: string): Promise<Order | null> => {
  const response = await api.get(`/Orders/${id}`);
  return response.data;
};

// PascalCase query params: ClientId, EditorId, Status
const getByClientAPI = async (clientId: string): Promise<Order[]> => {
  const response = await api.get('/Orders', { params: { ClientId: clientId } });
  return response.data;
};

const getByEditorAPI = async (editorId: string): Promise<Order[]> => {
  const response = await api.get('/Orders', { params: { EditorId: editorId } });
  return response.data;
};

const getByStatusAPI = async (status: OrderStatus): Promise<Order[]> => {
  const response = await api.get('/Orders', { params: { Status: status } });
  return response.data;
};

const createAPI = async (data: CreateOrderData): Promise<Order> => {
  const response = await api.post('/Orders', data);
  return response.data;
};

const updateAPI = async (id: string, data: Partial<Order>): Promise<Order> => {
  const response = await api.put(`/Orders/${id}`, data);
  return response.data;
};

const deleteAPI = async (id: string): Promise<void> => {
  await api.delete(`/Orders/${id}`);
};

const cancelAPI = async (id: string): Promise<Order> => {
  const response = await api.post(`/Orders/${id}/cancel`);
  return response.data;
};

// PascalCase: Backend usa /Orders/AvailableBalances
const getAvailableBalancesAPI = async (): Promise<ServiceBalanceLot[]> => {
  const response = await api.get('/Orders/AvailableBalances');
  return response.data;
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

  async updateStatus(id: string, Status: OrderStatus): Promise<Order> {
    return updateAPI(id, { Status });
  },

  async assignEditor(id: string, EditorId: string): Promise<Order> {
    return updateAPI(id, { EditorId } as Partial<Order>);
  },

  async delete(id: string): Promise<void> {
    return deleteAPI(id);
  },

  async cancel(id: string): Promise<Order> {
    return cancelAPI(id);
  },

  async getAvailableBalances(): Promise<ServiceBalanceLot[]> {
    return getAvailableBalancesAPI();
  },

  async getCancellationWindow(): Promise<number> {
    const response = await api.get<number>('/Orders/cancellation-window');
    return response.data;
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
      pending: orders.filter(o => o.Status === 'Pending').length,
      inProgress: orders.filter(o => o.Status === 'InProgress').length,
      inReview: orders.filter(o => o.Status === 'InReview').length,
      approved: orders.filter(o => o.Status === 'Approved').length,
    };
  },
};

// State reset function (for testing/demo purposes)
export const resetOrdersState = () => {
  // No-op for API-based service
};

export default orderService;
