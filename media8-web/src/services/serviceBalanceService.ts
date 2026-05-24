import {
  ServiceBalanceLot,
  ServiceBalanceAggregated,
  ConsumeResult,
} from '@/types/services';
import { api } from '@/lib/api';
import { differenceInDays } from 'date-fns';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Check if a lot is expired
const isLotExpired = (lot: ServiceBalanceLot): boolean => {
  if (!lot.expiresAt) return false;
  return new Date(lot.expiresAt) < new Date();
};

// Check if a lot has available quantity
const isLotAvailable = (lot: ServiceBalanceLot): boolean => {
  return lot.remainingQuantity > 0 && !isLotExpired(lot);
};

// Sort lots by expiration date (FIFO - earliest expiry first)
const sortLotsFIFO = (lots: ServiceBalanceLot[]): ServiceBalanceLot[] => {
  return [...lots].sort((a, b) => {
    // Lots without expiration go to the end
    if (!a.expiresAt && !b.expiresAt) return 0;
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });
};

// Group lots by service type AND plan name (each package/subscription is independent)
const groupLotsByServiceAndPlan = (lots: ServiceBalanceLot[]): Record<string, ServiceBalanceLot[]> => {
  return lots.reduce((acc, lot) => {
    // Unique key: serviceType + planName = each package is independent
    const key = `${lot.serviceType}::${lot.planName || 'default'}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(lot);
    return acc;
  }, {} as Record<string, ServiceBalanceLot[]>);
};

// Normalize serviceType from Backend (PascalCase) to Frontend (PascalCase) 
// The backend returns PascalCase, and our Frontend Types are PascalCase. 
// No transformation needed, just type assertion/validation if necessary.
const normalizeServiceType = (type: string): ServiceType => {
  // If we had legacy snake_case mapping, we would do it here. 
  // For now, assume backend sends valid PascalCase matching our keys.
  return type as ServiceType;
};

// Aggregate lots into UI-friendly format
const aggregateLots = (lots: ServiceBalanceLot[], options: { includeExpired?: boolean; sortByUrgency?: boolean } = {}): ServiceBalanceAggregated[] => {
  const { includeExpired = false, sortByUrgency = true } = options;

  // Group by serviceType + planName to keep packages separate
  const grouped = groupLotsByServiceAndPlan(lots);
  const now = new Date();

  const aggregated = Object.entries(grouped).map(([key, typeLots]) => {
    const rawServiceType = key.split('::')[0];
    const serviceType = normalizeServiceType(rawServiceType);

    // Get service config for name
    const config = serviceConfigs[serviceType];

    // Safety fallback
    if (!config) {
      console.warn(`[Frontend] Config not found for service type: ${serviceType} (raw: ${rawServiceType})`);
    }

    // Check if any lot is a subscription
    const subscriptionLot = typeLots.find(lot => lot.source === 'subscription');
    const isSubscription = !!subscriptionLot;

    // Filter non-expired lots (can have 0 remaining)
    const nonExpiredLots = typeLots.filter(lot => !isLotExpired(lot));

    // Filter available lots (with remaining quantity)
    const availableLots = typeLots.filter(isLotAvailable);
    const sortedLots = sortLotsFIFO(nonExpiredLots);

    // Calculate totals
    const totalQuantity = availableLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);

    // Check if all lots are expired
    const allLotsExpired = typeLots.length > 0 && nonExpiredLots.length === 0;

    // Is zeroed but not expired (for subscriptions mainly)
    const isZeroed = totalQuantity === 0 && !allLotsExpired;

    // Find nearest expiry date and quantity expiring soon
    const lotsWithExpiry = sortedLots.filter(lot => lot.expiresAt);
    const nearestExpiryDate = lotsWithExpiry[0]?.expiresAt;
    const expiringQuantity = lotsWithExpiry[0]?.remainingQuantity;

    // Calculate days until renewal (for subscriptions) - NEVER negative
    const rawDaysUntilRenewal = subscriptionLot?.renewsAt
      ? differenceInDays(new Date(subscriptionLot.renewsAt), now)
      : undefined;
    const daysUntilRenewal = rawDaysUntilRenewal !== undefined
      ? Math.max(0, rawDaysUntilRenewal)
      : undefined;

    // Calculate days until expiry (for packages/avulsos) - NEVER negative
    const rawDaysUntilExpiry = nearestExpiryDate
      ? differenceInDays(new Date(nearestExpiryDate), now)
      : undefined;
    const daysUntilExpiry = rawDaysUntilExpiry !== undefined
      ? Math.max(0, rawDaysUntilExpiry)
      : undefined;

    return {
      serviceType,
      category: config?.category || 'avulso',
      name: config?.name || serviceType,
      totalQuantity,
      nearestExpiryDate,
      expiringQuantity,
      renewsAt: subscriptionLot?.renewsAt,
      planName: typeLots[0].planName,
      lots: sortedLots,
      isSubscription,
      isZeroed,
      isExpired: allLotsExpired,
      daysUntilRenewal,
      daysUntilExpiry,
    };
  });

  // Filter based on options
  const filtered = aggregated.filter(agg => {
    if (includeExpired) return true;
    if (agg.isSubscription) return true;
    return !agg.isExpired;
  });

  // Sort by priority: 1) Active with quota > 2) Active zeroed > 3) Expired
  if (sortByUrgency) {
    filtered.sort((a, b) => {
      const aHasQuota = a.totalQuantity > 0 && !a.isExpired;
      const bHasQuota = b.totalQuantity > 0 && !b.isExpired;

      if (aHasQuota && !bHasQuota) return -1;
      if (!aHasQuota && bHasQuota) return 1;

      if (!aHasQuota && !bHasQuota) {
        const aIsActive = !a.isExpired;
        const bIsActive = !b.isExpired;

        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
      }

      const daysA = a.daysUntilRenewal ?? a.daysUntilExpiry ?? Infinity;
      const daysB = b.daysUntilRenewal ?? b.daysUntilExpiry ?? Infinity;
      return daysA - daysB;
    });
  }

  return filtered;
};

// ==========================================
// API FUNCTIONS
// ==========================================

// PascalCase: Backend usa /ServiceBalances/{userId}
const getLotsAPI = async (userId: string): Promise<ServiceBalanceLot[]> => {
  const response = await api.get(`/ServiceBalances/${userId}`);
  return response.data;
};

// NEW: Use Unified API (Snapshot Architecture)
// Backend usa query params em minúsculo: page, pageSize, status (ver ServiceBalancesController.cs)
const getMyBalancesAPI = async (page = 1, pageSize = 50, status = 'active'): Promise<{ data: import('../types/services').UnifiedServiceBalance[], total: number }> => {
  try {
    const response = await api.get('/ServiceBalances/MyBalances', {
      params: { page, pageSize, status }
    });
    // API returns direct array currently in standard controller return, but might be wrapped if we used PaginatedResponse.
    // Let's check Controller: return Ok(dtos) with Header.
    // So data is array. Header 'X-Total-Count' is total.
    return {
      data: response.data,
      total: parseInt(response.headers['x-total-count'] || '0', 10)
    };
  } catch (error: any) {
    // DIAGNÓSTICO: Exibe erro real do .NET ProblemDetails
    console.error('>>> ERRO 400 REAL DO .NET 10:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        params: error.config?.params
      }
    });
    
    // EXIBE ERROS DE VALIDAÇÃO DO .NET
    if (error.response?.data?.errors) {
      console.error('>>> ERROS DE VALIDAÇÃO DO .NET:', error.response.data.errors);
      Object.entries(error.response.data.errors).forEach(([key, value]: [string, any]) => {
        console.error(`  - ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
      });
    }
    
    throw error;
  }
};

const getClientBalancesAPI = async (clientId: string, page = 1, pageSize = 50, status = 'active'): Promise<{ data: import('../types/services').UnifiedServiceBalance[], total: number }> => {
  try {
    const response = await api.get(`/ServiceBalances/${clientId}`, {
      params: { page, pageSize, status }
    });
    return {
      data: response.data,
      total: parseInt(response.headers['x-total-count'] || '0', 10)
    };
  } catch (error: any) {
    // DIAGNÓSTICO: Exibe erro real do .NET ProblemDetails
    console.error('>>> ERRO 400 REAL DO .NET 10 (Client):', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        params: error.config?.params
      }
    });
    throw error;
  }
};

const consumeServiceAPI = async (userId: string, videoFormatId: string): Promise<ConsumeResult> => {
  const response = await api.post(`/users/${userId}/service-balances/consume`, { videoFormatId });
  return response.data;
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const serviceBalanceService = {
  /**
   * Get all lots for a user (Legacy / Internal use)
   */
  async getLots(userId: string): Promise<ServiceBalanceLot[]> {
    return getLotsAPI(userId);
  },

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
   * Get aggregated balances for UI display (active services only, sorted by urgency)
   */
  async getAggregatedBalances(userId: string): Promise<ServiceBalanceAggregated[]> {
    const lots = await this.getLots(userId);
    return aggregateLots(lots, { includeExpired: false, sortByUrgency: true });
  },

  /**
   * Get ALL aggregated balances including expired (for history page)
   */
  async getAllAggregatedBalances(userId: string): Promise<ServiceBalanceAggregated[]> {
    const lots = await this.getLots(userId);
    return aggregateLots(lots, { includeExpired: true, sortByUrgency: true });
  },

  /**
   * Consume one unit of a service using FIFO logic (Fase 0: videoFormatId)
   */
  async consumeService(userId: string, videoFormatId: string): Promise<ConsumeResult> {
    return consumeServiceAPI(userId, videoFormatId);
  },

  /**
   * Check if user has available balance for a video format (LEGACY - will be refactored)
   */
  async hasBalance(userId: string, videoFormatId: string): Promise<boolean> {
    const lots = await this.getLots(userId);
    return lots.some(
      lot => lot.videoFormatId === videoFormatId && isLotAvailable(lot)
    );
  },
};

export default serviceBalanceService;
