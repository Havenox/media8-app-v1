import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, CreatePackageRequest, PackageCategory } from '@/types/packages';
import { packageService } from '@/services/packageService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';

// ==========================================
// QUERY KEYS
// ==========================================
export const packageKeys = {
  all: ['packages'] as const,
  lists: () => [...packageKeys.all, 'list'] as const,
  active: () => [...packageKeys.all, 'active'] as const,
  details: () => [...packageKeys.all, 'detail'] as const,
  detail: (id: string) => [...packageKeys.details(), id] as const,
  byCategory: (category: PackageCategory) => [...packageKeys.all, 'category', category] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Fetch all packages
 */
export const usePackages = () => {
  return useQuery({
    queryKey: packageKeys.lists(),
    queryFn: () => packageService.getAll(),
  });
};

/**
 * Fetch only active packages
 */
export const useActivePackages = () => {
  return useQuery({
    queryKey: packageKeys.active(),
    queryFn: () => packageService.getActive(),
  });
};

/**
 * Fetch a single package by ID
 */
export const usePackage = (id: string | undefined) => {
  return useQuery({
    queryKey: packageKeys.detail(id!),
    queryFn: () => packageService.getById(id!),
    enabled: !!id,
  });
};

/**
 * Fetch packages by category
 */
export const usePackagesByCategory = (category: PackageCategory) => {
  return useQuery({
    queryKey: packageKeys.byCategory(category),
    queryFn: () => packageService.getByCategory(category),
  });
};

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a new package
 */
export const useCreatePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePackageRequest) => packageService.create(data),
    onSuccess: (newPackage) => {
      queryClient.invalidateQueries({ queryKey: packageKeys.all });
      toast.success(`Pacote "${newPackage.name}" criado com sucesso!`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Update an existing package
 */
export const useUpdatePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Package> }) =>
      packageService.update(id, data),
    onSuccess: (updatedPackage) => {
      queryClient.invalidateQueries({ queryKey: packageKeys.all });
      queryClient.invalidateQueries({ queryKey: packageKeys.detail(updatedPackage.id) });
      toast.success('Pacote atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Toggle package active status
 */
export const useTogglePackageStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => packageService.toggleVisibility(id),
    onSuccess: (updatedPackage) => {
      queryClient.invalidateQueries({ queryKey: packageKeys.all });
      const status = updatedPackage.isPublic ? 'agora é público' : 'agora é privado';
      toast.success(`Visibilidade alterada: O pacote ${status}!`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Delete a package
 */
export const useDeletePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => packageService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageKeys.all });
      toast.success('Pacote removido com sucesso!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
