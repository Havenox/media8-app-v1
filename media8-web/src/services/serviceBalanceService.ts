import { UnifiedServiceBalance, ConsumeResult } from '@/types/services';
import { api } from '@/lib/api';

// ==========================================
// API FUNCTIONS
// ==========================================

// NEW: Use Unified API (Snapshot Architecture)
// Backend usa query params em minúsculo: page, pageSize, status (ver ServiceBalancesController.cs)
const getMyBalancesAPI = async (page = 1, pageSize = 50, status = 'active'): Promise<{ data: UnifiedServiceBalance[], total: number }> => {
  try {
    const response = await api.get('/ServiceBalances/MyBalances', {
      params: { page, pageSize, status }
    });
    return {
      data: response.data,
      total: parseInt(response.headers['x-total-count'] || '0', 10)
    };
  } catch (error: any) {
    console.error('>>> ERRO REAL DO .NET:', {
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      }
    });
    throw error;
  }
};

const getClientBalancesAPI = async (clientId: string, page = 1, pageSize = 50, status = 'active'): Promise<{ data: UnifiedServiceBalance[], total: number }> => {
  try {
    const response = await api.get(`/ServiceBalances/${clientId}`, {
      params: { page, pageSize, status }
    });
    return {
      data: response.data,
      total: parseInt(response.headers['x-total-count'] || '0', 10)
    };
  } catch (error: any) {
    console.error('>>> ERRO REAL DO .NET (Client):', {
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

const consumeServiceAPI = async (userId: string, videoFormatId: string): Promise<ConsumeResult> => {
  const response = await api.post(`/users/${userId}/service-balances/consume`, { VideoFormatId: videoFormatId });
  return response.data;
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const serviceBalanceService = {
  /**
   * Get Paged Balances for Current User (Client Dashboard)
   * Backend usa: page, pageSize, status (minúsculo)
   */
  async getMyBalances(page = 1, pageSize = 50, status = 'active') {
    return getMyBalancesAPI(page, pageSize, status);
  },

  /**
   * Get Paged Balances for Specific Client (Admin View)
   * Backend usa: page, pageSize, status (minúsculo)
   */
  async getClientBalances(clientId: string, page = 1, pageSize = 50, status = 'active') {
    return getClientBalancesAPI(clientId, page, pageSize, status);
  },

  /**
   * Consume one unit of a service using FIFO logic
   */
  async consumeService(userId: string, videoFormatId: string): Promise<ConsumeResult> {
    return consumeServiceAPI(userId, videoFormatId);
  },
};

// State reset function (for testing/demo purposes)
export const resetServiceBalanceState = () => {
  // No-op for API-based service
};

export default serviceBalanceService;
