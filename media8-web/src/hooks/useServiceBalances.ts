import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceBalanceService } from '@/services/serviceBalanceService';
import { ServiceType, ServiceBalanceAggregated, ServiceBalanceLot } from '@/types/services';
import { useToast } from '@/hooks/use-toast';

// Query keys - exported for use in other hooks
export const serviceBalanceKeys = {
  all: ['service-balances'] as const,
  balances: (userId: string) => ['service-balances', userId] as const,
  lots: (userId: string) => ['service-balance-lots', userId] as const,
};

// Alias for internal use
const QUERY_KEYS = serviceBalanceKeys;

/**
 * Hook to fetch aggregated service balances for UI display
 */
export function useServiceBalances(userId: string | undefined) {
  return useQuery<ServiceBalanceAggregated[]>({
    queryKey: QUERY_KEYS.balances(userId || ''),
    queryFn: () => serviceBalanceService.getAggregatedBalances(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch raw lots (for detailed views)
 */
export function useServiceBalanceLots(userId: string | undefined) {
  return useQuery<ServiceBalanceLot[]>({
    queryKey: QUERY_KEYS.lots(userId || ''),
    queryFn: () => serviceBalanceService.getLots(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to consume a service (with FIFO logic)
 */
export function useConsumeService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, serviceType }: { userId: string; serviceType: ServiceType }) => {
      return serviceBalanceService.consumeService(userId, serviceType);
    },
    onSuccess: (result, { userId, serviceType }) => {
      if (result.success) {
        // Invalidate both queries to refresh data
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.balances(userId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lots(userId) });
      } else {
        // Handle error cases
        const errorMessages: Record<string, string> = {
          NO_BALANCE: 'Você não tem saldo disponível para este serviço.',
          EXPIRED: 'Seus créditos para este serviço expiraram.',
          NOT_FOUND: 'Serviço não encontrado.',
        };
        toast({
          title: 'Erro ao consumir serviço',
          description: errorMessages[result.error || ''] || 'Erro desconhecido.',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a solicitação.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to get available services for order creation
 * Returns only services with balance > 0
 */
export function useAvailableServices(userId: string | undefined) {
  const { data: balances, ...rest } = useServiceBalances(userId);
  
  return {
    ...rest,
    data: balances?.filter(b => b.totalQuantity > 0) || [],
  };
}

/**
 * Hook to fetch ALL service balances including expired (for history page)
 */
export function useAllServiceBalances(userId: string | undefined) {
  return useQuery<ServiceBalanceAggregated[]>({
    queryKey: [...QUERY_KEYS.balances(userId || ''), 'all'],
    queryFn: () => serviceBalanceService.getAllAggregatedBalances(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
