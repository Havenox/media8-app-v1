import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VideoFormat } from '@/types/api';
import { videoFormatService, CreateVideoFormatRequest, UpdateVideoFormatRequest } from '@/services/videoFormatService';
import { toast } from 'sonner';

// ==========================================
// QUERY KEYS
// ==========================================
export const videoFormatKeys = {
  all: ['videoFormats'] as const,
  lists: () => [...videoFormatKeys.all, 'list'] as const,
  details: () => [...videoFormatKeys.all, 'detail'] as const,
  detail: (id: string) => [...videoFormatKeys.details(), id] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Fetch all video formats (dynamic catalog - Fase 0)
 * staleTime: 5 minutos (catálogo muda com pouca frequência)
 */
export const useVideoFormats = () => {
  return useQuery({
    queryKey: videoFormatKeys.lists(),
    queryFn: () => videoFormatService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Fetch a single video format by ID
 */
export const useVideoFormat = (id: string | undefined) => {
  return useQuery({
    queryKey: videoFormatKeys.detail(id!),
    queryFn: () => videoFormatService.getById(id!),
    enabled: !!id,
  });
};

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a new video format (Admin only)
 */
export const useCreateVideoFormat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVideoFormatRequest) => videoFormatService.create(data),
    onSuccess: (newFormat) => {
      queryClient.invalidateQueries({ queryKey: videoFormatKeys.all });
      toast.success(`Formato "${newFormat.name}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar formato de vídeo');
    },
  });
};

/**
 * Update an existing video format (Admin only)
 */
export const useUpdateVideoFormat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVideoFormatRequest }) =>
      videoFormatService.update(id, data),
    onSuccess: (updatedFormat) => {
      queryClient.invalidateQueries({ queryKey: videoFormatKeys.all });
      queryClient.invalidateQueries({ queryKey: videoFormatKeys.detail(updatedFormat.id) });
      toast.success('Formato atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar formato de vídeo');
    },
  });
};

/**
* Delete (soft delete) a video format (Admin only)
*/
export const useDeleteVideoFormat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) => videoFormatService.delete(id, permanent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoFormatKeys.all });
      toast.success('Formato removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover formato de vídeo');
    },
  });
};
