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

// Helper: Converte status para PascalCase (backend .NET enum)
const mapStatusToPascalCase = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'expired': 'Expired',
    'all': 'All',
    'Active': 'Active',
    'Expired': 'Expired',
    'All': 'All'
  };
  return statusMap[status] || 'Active';
};

export const useServiceBalances = ({
  clientId,
  status = 'active',
  pageSize = 20,
  enabled = true
}: UseServiceBalancesOptions = {}) => {
  // Sanitiza status para PascalCase antes de enviar
  const pascalStatus = mapStatusToPascalCase(status);
  
  return useInfiniteQuery({
    queryKey: ['service-balances', clientId || 'me', status],
    queryFn: async ({ pageParam = 1 }) => {
      // Determine which service method to call
      if (clientId) {
        return serviceBalanceService.getClientBalances(clientId, pageParam, pageSize, pascalStatus);
      } else {
        return serviceBalanceService.getMyBalances(pageParam, pageSize, pascalStatus);
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
      // PascalCase: 'All' para backend .NET
      const result = await serviceBalanceService.getMyBalances(1, 100, 'All');
      return result.data;
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
