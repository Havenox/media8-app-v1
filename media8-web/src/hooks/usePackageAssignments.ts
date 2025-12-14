import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientPackageAssignment, AssignPackageRequest } from '@/types/packages';
import { packageAssignmentService } from '@/services/packageAssignmentService';
import { toast } from 'sonner';

// Import service balance keys to invalidate when assignment happens
import { serviceBalanceKeys } from './useServiceBalances';

// ==========================================
// QUERY KEYS
// ==========================================
export const assignmentKeys = {
  all: ['package-assignments'] as const,
  lists: () => [...assignmentKeys.all, 'list'] as const,
  byClient: (clientId: string) => [...assignmentKeys.all, 'client', clientId] as const,
  activeByClient: (clientId: string) => [...assignmentKeys.all, 'active', clientId] as const,
  detail: (id: string) => [...assignmentKeys.all, 'detail', id] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Fetch all package assignments
 */
export const usePackageAssignments = () => {
  return useQuery({
    queryKey: assignmentKeys.lists(),
    queryFn: () => packageAssignmentService.getAll(),
  });
};

/**
 * Fetch assignments for a specific client
 */
export const useClientAssignments = (clientId: string | undefined) => {
  return useQuery({
    queryKey: assignmentKeys.byClient(clientId!),
    queryFn: () => packageAssignmentService.getByClient(clientId!),
    enabled: !!clientId,
  });
};

/**
 * Fetch active assignment for a client
 */
export const useClientActivePackage = (clientId: string | undefined) => {
  return useQuery({
    queryKey: assignmentKeys.activeByClient(clientId!),
    queryFn: () => packageAssignmentService.getActiveByClient(clientId!),
    enabled: !!clientId,
  });
};

/**
 * Fetch a single assignment by ID
 */
export const usePackageAssignment = (id: string | undefined) => {
  return useQuery({
    queryKey: assignmentKeys.detail(id!),
    queryFn: () => packageAssignmentService.getById(id!),
    enabled: !!id,
  });
};

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Assign a package to a client
 */
export const useAssignPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, assignedBy }: { data: AssignPackageRequest; assignedBy: string }) => 
      packageAssignmentService.assign(data, assignedBy),
    onSuccess: (result, variables) => {
      // Invalidate assignment queries
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.byClient(variables.data.clientId) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.activeByClient(variables.data.clientId) });
      
      // Invalidate service balance queries (since new lots were created)
      queryClient.invalidateQueries({ queryKey: serviceBalanceKeys.all });
      
      toast.success('Pacote atribuído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atribuir pacote');
    },
  });
};

/**
 * Cancel a package assignment
 */
export const useCancelAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => packageAssignmentService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success('Atribuição cancelada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cancelar atribuição');
    },
  });
};
