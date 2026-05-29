import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  ClientContract,
  CreateClientContractRequest,
  UpdateClientContractRequest,
  ClientContractResponse,
} from '@/types/offers';
import { clientContractService } from '@/services/clientContractService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';
import { getNextPageParam } from '@/lib/pagination';

// ==========================================
// QUERY KEYS
// ==========================================
export const clientContractKeys = {
  all: ['client-contracts'] as const,
  lists: () => [...clientContractKeys.all, 'list'] as const,
  infinite: (filters: Record<string, any>) => [...clientContractKeys.lists(), 'infinite', filters] as const,
  myInfinite: (filters: Record<string, any>) => [...clientContractKeys.all, 'my-infinite', filters] as const,
  details: () => [...clientContractKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientContractKeys.details(), id] as const,
  byClient: (clientId: string) => [...clientContractKeys.all, 'client', clientId] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Fetch all client contracts (optionally filtered by client)
 */
export const useClientContracts = (clientId?: string, enabled = true) => {
  return useQuery({
    queryKey: clientId ? clientContractKeys.byClient(clientId) : clientContractKeys.lists(),
    queryFn: () => clientContractService.getAll(1, 100, clientId),
    enabled,
  });
};

/**
 * Fetch client contracts with infinite scroll
 */
export const useInfiniteClientContracts = (clientId?: string, pageSize = 10, enabled = true) => {
  return useInfiniteQuery({
    queryKey: clientContractKeys.infinite({ clientId, pageSize }),
    queryFn: ({ pageParam = 1 }) => clientContractService.getAll(pageParam as number, pageSize, clientId),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => getNextPageParam(lastPage, allPages, pageSize),
    enabled,
  });
};

/**
 * Fetch a single client contract by ID
 */
export const useClientContract = (id: string | undefined) => {
  return useQuery({
    queryKey: clientContractKeys.detail(id!),
    queryFn: () => clientContractService.getById(id!),
    enabled: !!id,
  });
};

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a new client contract (assign offer to client)
 */
export const useCreateClientContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientContractRequest) =>
      clientContractService.create(data),
    onSuccess: (newContract) => {
      // Invalidate contracts and service balances
      queryClient.invalidateQueries({ queryKey: clientContractKeys.all });
      queryClient.invalidateQueries({ queryKey: ['service-balances'] });
      toast.success(`Contrato criado com sucesso para o cliente!`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Update an existing client contract
 */
export const useUpdateClientContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientContractRequest }) =>
      clientContractService.update(id, data),
    onSuccess: (updatedContract) => {
      queryClient.invalidateQueries({ queryKey: clientContractKeys.all });
      queryClient.invalidateQueries({ queryKey: clientContractKeys.detail(updatedContract.Id) });
      toast.success('Contrato atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Fetch the authenticated client's contracts (active or archived)
 */
export const useMyClientContracts = (showArchived: boolean = false, enabled = true) => {
  return useQuery({
    queryKey: [...clientContractKeys.all, 'my', { showArchived }],
    queryFn: () => clientContractService.getMyContracts(1, 100, showArchived),
    enabled,
  });
};

/**
 * Fetch the authenticated client's contracts with infinite scroll
 */
export const useInfiniteMyClientContracts = (showArchived = false, pageSize = 10, enabled = true) => {
  return useInfiniteQuery({
    queryKey: clientContractKeys.myInfinite({ showArchived, pageSize }),
    queryFn: ({ pageParam = 1 }) => clientContractService.getMyContracts(pageParam as number, pageSize, showArchived),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => getNextPageParam(lastPage, allPages, pageSize),
    enabled,
  });
};

/**
 * Archive an existing client contract (soft delete/hide)
 */
export const useArchiveClientContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientContractService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientContractKeys.all });
      queryClient.invalidateQueries({ queryKey: ['service-balances'] });
      toast.success('Contrato arquivado com sucesso!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Restore/Unarchive an archived client contract
 */
export const useUnarchiveClientContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientContractService.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientContractKeys.all });
      queryClient.invalidateQueries({ queryKey: ['service-balances'] });
      toast.success('Contrato desarquivado com sucesso!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
