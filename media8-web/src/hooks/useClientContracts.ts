import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClientContract,
  CreateClientContractRequest,
  UpdateClientContractRequest,
  ClientContractResponse,
} from '@/types/offers';
import { clientContractService } from '@/services/clientContractService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';

// ==========================================
// QUERY KEYS
// ==========================================
export const clientContractKeys = {
  all: ['client-contracts'] as const,
  lists: () => [...clientContractKeys.all, 'list'] as const,
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
export const useClientContracts = (clientId?: string) => {
  return useQuery({
    queryKey: clientId ? clientContractKeys.byClient(clientId) : clientContractKeys.lists(),
    queryFn: () => clientContractService.getAll(clientId),
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
