import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EditingStyle } from '@/types/services';
import { editingStyleService, CreateEditingStyleRequest, UpdateEditingStyleRequest } from '@/services/editingStyleService';
import { toast } from 'sonner';

// ==========================================
// QUERY KEYS
// ==========================================
export const editingStyleKeys = {
  all: ['editingStyles'] as const,
  lists: () => [...editingStyleKeys.all, 'list'] as const,
  details: () => [...editingStyleKeys.all, 'detail'] as const,
  detail: (id: string) => [...editingStyleKeys.details(), id] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Fetch all editing styles
 * staleTime: 5 minutos (catálogo muda com pouca frequência)
 */
export const useEditingStyles = () => {
  return useQuery({
    queryKey: editingStyleKeys.lists(),
    queryFn: () => editingStyleService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Fetch a single editing style by ID
 */
export const useEditingStyle = (id: string | undefined) => {
  return useQuery({
    queryKey: editingStyleKeys.detail(id!),
    queryFn: () => editingStyleService.getById(id!),
    enabled: !!id,
  });
};

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a new editing style (Admin only)
 */
export const useCreateEditingStyle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEditingStyleRequest) => editingStyleService.create(data),
    onSuccess: (newStyle) => {
      queryClient.invalidateQueries({ queryKey: editingStyleKeys.all });
      queryClient.invalidateQueries({ queryKey: editingStyleKeys.detail(newStyle.id) });
      toast.success(`Estilo "${newStyle.name}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar estilo de edição');
    },
  });
};

/**
 * Update an existing editing style (Admin only)
 */
export const useUpdateEditingStyle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEditingStyleRequest }) =>
      editingStyleService.update(id, data),
    onSuccess: (updatedStyle) => {
      queryClient.invalidateQueries({ queryKey: editingStyleKeys.all });
      queryClient.invalidateQueries({ queryKey: editingStyleKeys.detail(updatedStyle.id) });
      toast.success('Estilo atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar estilo de edição');
    },
  });
};

/**
 * Delete (soft delete) an editing style (Admin only)
 */
export const useDeleteEditingStyle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => editingStyleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editingStyleKeys.all });
      toast.success('Estilo removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover estilo de edição');
    },
  });
};
