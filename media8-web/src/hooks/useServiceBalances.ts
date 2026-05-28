import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceBalanceService } from '@/services/serviceBalanceService';
import { UnifiedServiceBalance, ServiceBalanceAggregated, ServiceCategory } from '@/types/services';

export const serviceBalanceKeys = {
  all: ['service-balances'] as const,
  available: ['available-services'] as const,
};

interface UseServiceBalancesOptions {
  clientId?: string; // Optional: If provided, fetches for specific client (Admin). If not, fetches for current user.
  status?: 'active' | 'expired' | 'all';
  pageSize?: number;
  enabled?: boolean;
}

import { getNextPageParam } from '@/lib/pagination';

export const aggregateBalances = (lots: UnifiedServiceBalance[]): ServiceBalanceAggregated[] => {
  const groups: Record<string, UnifiedServiceBalance[]> = {};
  
  lots.forEach(lot => {
    // Group by format name and offer name/editing style to match legacy grouping
    const key = `${lot.SnapshotVideoFormatName}::${lot.SnapshotOfferName}::${lot.SnapshotEditingStyleName}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(lot);
  });

  return Object.entries(groups).map(([key, groupLots]) => {
    const first = groupLots[0];
    
    // Sum remaining quantities across all active non-expired lots
    const totalRemaining = groupLots
      .filter(l => l.Status !== 'expired')
      .reduce((acc, l) => acc + l.RemainingQuantity, 0);
    
    // Determine category
    let category: ServiceCategory = 'avulso';
    const formatLower = first.SnapshotVideoFormatName.toLowerCase();
    if (formatLower.includes('reels')) {
      category = 'reels';
    } else if (formatLower.includes('youtube')) {
      category = 'youtube';
    } else if (first.ContractType === 'Pacote') {
      category = 'pacote';
    }

    const isSubscription = groupLots.some(l => l.ContractType === 'Assinatura');
    const isExpired = groupLots.every(l => l.Status === 'expired');
    const isZeroed = totalRemaining === 0;

    // Calculate days until expiry or renewal
    let minDays: number | undefined = undefined;
    
    groupLots.forEach(l => {
      if (l.ExpiresAt) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(l.ExpiresAt);
        exp.setHours(0, 0, 0, 0);
        const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (minDays === undefined || diff < minDays) {
          minDays = diff;
        }
      } else if (isSubscription && l.PurchaseDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const purchase = new Date(l.PurchaseDate);
        const exp = new Date(purchase.getTime() + 30 * 24 * 60 * 60 * 1000);
        exp.setHours(0, 0, 0, 0);
        const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (minDays === undefined || diff < minDays) {
          minDays = diff;
        }
      }
    });

    // Map legacy lots structure to avoid breaking existing Card code
    const mappedLots = groupLots.map(l => ({
      ...l,
      contract: {
        snapshotOfferName: l.SnapshotOfferName,
        snapshotVideoFormatName: l.SnapshotVideoFormatName,
        snapshotEditingStyleName: l.SnapshotEditingStyleName,
        snapshotMaxDurationSeconds: l.SnapshotMaxDurationSeconds,
        snapshotContractType: l.ContractType,
      },
      purchasedAt: l.PurchaseDate,
    }));

    return {
      serviceType: first.SnapshotVideoFormatName,
      name: `${first.SnapshotVideoFormatName} (${first.SnapshotEditingStyleName})`,
      category,
      planName: first.SnapshotOfferName,
      totalQuantity: totalRemaining, // Show remaining total available
      isZeroed,
      isExpired,
      isSubscription,
      daysUntilRenewal: isSubscription ? minDays : undefined,
      daysUntilExpiry: !isSubscription ? minDays : undefined,
      lots: mappedLots
    };
  });
};

export const useServiceBalances = ({
  clientId,
  status = 'active',
  pageSize = 20,
  enabled = true
}: UseServiceBalancesOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ['service-balances', clientId || 'me', status],
    queryFn: async ({ pageParam = 1 }) => {
      // Backend usa query params em minúsculo: page, pageSize, status
      if (clientId) {
        return serviceBalanceService.getClientBalances(clientId, pageParam, pageSize, status);
      } else {
        return serviceBalanceService.getMyBalances(pageParam, pageSize, status);
      }
    },
    getNextPageParam: (lastPage, allPages) => getNextPageParam(lastPage, allPages, pageSize),
    initialPageParam: 1,
    enabled: enabled,
  });
};

export const useAvailableServices = (userId?: string) => {
  return useQuery({
    queryKey: ['available-services', userId],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return serviceBalanceService.getAggregatedBalances(userId);
    },
    enabled: !!userId,
  });
};

export const useAllServiceBalances = (userId?: string) => {
  return useQuery({
    queryKey: ['service-balances', 'all-flat', userId],
    queryFn: async () => {
      // Fetch large page to simulate "All" for client-side filtering
      // Backend usa status em minúsculo: 'active', 'expired', 'all'
      const result = await serviceBalanceService.getMyBalances(1, 100, 'all');
      return aggregateBalances(result.data);
    },
    enabled: !!userId
  });
};

export const useConsumeService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, videoFormatId }: { userId: string, videoFormatId: string }) =>
      serviceBalanceService.consumeService(userId, videoFormatId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate both aggregated and infinite lists
        queryClient.invalidateQueries({ queryKey: ['available-services', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['service-balances'] });
      }
    }
  });
};
