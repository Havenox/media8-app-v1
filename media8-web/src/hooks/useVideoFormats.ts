import { useQuery } from '@tanstack/react-query';
import { VideoFormat } from '@/types/api';
import { videoFormatService } from '@/services/videoFormatService';

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
