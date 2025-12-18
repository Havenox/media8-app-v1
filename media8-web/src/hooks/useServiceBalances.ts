import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceBalanceService } from '@/services/serviceBalanceService';
import { UnifiedServiceBalance } from '@/types/services';

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

export const useServiceBalances = ({
  clientId,
  status = 'active',
  pageSize = 20,
  enabled = true
}: UseServiceBalancesOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ['service-balances', clientId || 'me', status],
    queryFn: async ({ pageParam = 1 }) => {
      // Determine which service method to call
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
      // Ideal fix: Refactor ServicesPage to server-side filtering
      const result = await serviceBalanceService.getMyBalances(1, 100, 'all');
      return result.data;
    },
    enabled: !!userId
  });
};

export const useConsumeService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, serviceType }: { userId: string, serviceType: import('@/types/services').ServiceType }) =>
      serviceBalanceService.consumeService(userId, serviceType),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate both aggregated and infinite lists
        queryClient.invalidateQueries({ queryKey: ['available-services', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['service-balances'] });
      }
    }
  });
};
