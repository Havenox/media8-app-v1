import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  VisualIdentityProfile,
  EditingProfile,
  CreateVisualIdentityProfileRequest,
  UpdateVisualIdentityProfileRequest,
  CreateEditingProfileRequest,
  UpdateEditingProfileRequest,
} from '@/types/profiles';
import { visualIdentityProfileService, editingProfileService } from '@/services/profileService';
import { toast } from 'sonner';

// ==========================================
// VISUAL IDENTITY PROFILE - QUERY KEYS
// ==========================================

export const visualIdentityKeys = {
  all: ['visualIdentityProfiles'] as const,
  lists: () => [...visualIdentityKeys.all, 'list'] as const,
  details: () => [...visualIdentityKeys.all, 'detail'] as const,
  detail: (id: string) => [...visualIdentityKeys.details(), id] as const,
  archived: () => [...visualIdentityKeys.all, 'archived'] as const,
};

// ==========================================
// VISUAL IDENTITY PROFILE - QUERIES
// ==========================================

/**
 * Fetch all visual identity profiles for the current user
 * @param onlyActive - Filter only active profiles (default: true)
 * staleTime: 5 minutos (perfis mudam com pouca frequência)
 */
export const useVisualIdentityProfiles = (onlyActive: boolean = true) => {
  return useQuery({
    queryKey: [...visualIdentityKeys.lists(), { onlyActive }],
    queryFn: () => visualIdentityProfileService.getAll(onlyActive),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Fetch a single visual identity profile by ID
 */
export const useVisualIdentityProfile = (id: string | undefined) => {
  return useQuery({
    queryKey: visualIdentityKeys.detail(id!),
    queryFn: () => visualIdentityProfileService.getById(id!),
    enabled: !!id,
  });
};

// ==========================================
// VISUAL IDENTITY PROFILE - MUTATIONS
// ==========================================

/**
 * Create a new visual identity profile
 */
export const useCreateVisualIdentityProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVisualIdentityProfileRequest) =>
      visualIdentityProfileService.create(data),
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: visualIdentityKeys.all });
      toast.success(`Perfil "${newProfile.name}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar perfil de identidade visual');
    },
  });
};

/**
 * Update an existing visual identity profile
 */
export const useUpdateVisualIdentityProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVisualIdentityProfileRequest }) =>
      visualIdentityProfileService.update(id, data),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: visualIdentityKeys.all });
      queryClient.invalidateQueries({ queryKey: visualIdentityKeys.detail(updatedProfile.id) });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar perfil de identidade visual');
    },
  });
};

/**
 * Archive (soft delete) a visual identity profile
 */
export const useArchiveVisualIdentityProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => visualIdentityProfileService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: visualIdentityKeys.all });
      toast.success('Perfil arquivado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao arquivar perfil');
    },
  });
};

/**
 * Restore an archived visual identity profile
 */
export const useRestoreVisualIdentityProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => visualIdentityProfileService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: visualIdentityKeys.all });
      toast.success('Perfil restaurado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao restaurar perfil');
    },
  });
};

/**
 * Permanently delete a visual identity profile (hard delete)
 */
export const useHardDeleteVisualIdentityProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => visualIdentityProfileService.hardDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: visualIdentityKeys.all });
      queryClient.invalidateQueries({ queryKey: visualIdentityKeys.archived() });
      toast.success('Perfil excluído permanentemente!');
    },
    onError: (error: Error) => {
      // Handle business rule exception (422)
      if (error.message.includes('PROFILE_MUST_BE_INACTIVE')) {
        toast.error('O perfil precisa estar arquivado antes de ser excluído permanentemente.');
      } else if (error.message.includes('PROFILE_IN_USE')) {
        toast.error('Este perfil está vinculado a um pedido e não pode ser excluído.');
      } else {
        toast.error(error.message || 'Erro ao excluir perfil permanentemente');
      }
    },
  });
};

// ==========================================
// EDITING PROFILE - QUERY KEYS
// ==========================================

export const editingKeys = {
  all: ['editingProfiles'] as const,
  lists: () => [...editingKeys.all, 'list'] as const,
  details: () => [...editingKeys.all, 'detail'] as const,
  detail: (id: string) => [...editingKeys.details(), id] as const,
  archived: () => [...editingKeys.all, 'archived'] as const,
};

// ==========================================
// EDITING PROFILE - QUERIES
// ==========================================

/**
 * Fetch all editing profiles for the current user
 * @param onlyActive - Filter only active profiles (default: true)
 * staleTime: 5 minutos (perfis mudam com pouca frequência)
 */
export const useEditingProfiles = (onlyActive: boolean = true) => {
  return useQuery({
    queryKey: [...editingKeys.lists(), { onlyActive }],
    queryFn: () => editingProfileService.getAll(onlyActive),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Fetch a single editing profile by ID
 */
export const useEditingProfile = (id: string | undefined) => {
  return useQuery({
    queryKey: editingKeys.detail(id!),
    queryFn: () => editingProfileService.getById(id!),
    enabled: !!id,
  });
};

// ==========================================
// EDITING PROFILE - MUTATIONS
// ==========================================

/**
 * Create a new editing profile
 */
export const useCreateEditingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEditingProfileRequest) => editingProfileService.create(data),
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: editingKeys.all });
      toast.success(`Perfil "${newProfile.name}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar perfil de edição');
    },
  });
};

/**
 * Update an existing editing profile
 */
export const useUpdateEditingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEditingProfileRequest }) =>
      editingProfileService.update(id, data),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: editingKeys.all });
      queryClient.invalidateQueries({ queryKey: editingKeys.detail(updatedProfile.id) });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar perfil de edição');
    },
  });
};

/**
 * Archive (soft delete) an editing profile
 */
export const useArchiveEditingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => editingProfileService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editingKeys.all });
      toast.success('Perfil arquivado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao arquivar perfil');
    },
  });
};

/**
 * Restore an archived editing profile
 */
export const useRestoreEditingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => editingProfileService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editingKeys.all });
      toast.success('Perfil restaurado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao restaurar perfil');
    },
  });
};

/**
 * Permanently delete an editing profile (hard delete)
 */
export const useHardDeleteEditingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => editingProfileService.hardDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editingKeys.all });
      queryClient.invalidateQueries({ queryKey: editingKeys.archived() });
      toast.success('Perfil excluído permanentemente!');
    },
    onError: (error: Error) => {
      // Handle business rule exception (422)
      if (error.message.includes('PROFILE_MUST_BE_INACTIVE')) {
        toast.error('O perfil precisa estar arquivado antes de ser excluído permanentemente.');
      } else if (error.message.includes('PROFILE_IN_USE')) {
        toast.error('Este perfil está vinculado a um pedido e não pode ser excluído.');
      } else {
        toast.error(error.message || 'Erro ao excluir perfil permanentemente');
      }
    },
  });
};
