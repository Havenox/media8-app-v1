import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { User, UserRole } from '@/types/api';
import { userService } from '@/services/userService';
import { toast } from 'sonner';

// ==========================================
// QUERY KEYS
// ==========================================
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, string>) => [...userKeys.lists(), filters] as const,
  infinite: (filters: Record<string, any>) => [...userKeys.lists(), 'infinite', filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  byRole: (role: UserRole) => [...userKeys.all, 'role', role] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Fetch user statistics (counts)
 */
export const useUserStats = () => {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: () => userService.getStats(),
  });
};

/**
 * Fetch users with infinite scroll
 */
export const useInfiniteUsers = (role?: UserRole, pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: userKeys.infinite({ role, pageSize }),
    queryFn: ({ pageParam = 1 }) => userService.getAll(pageParam, pageSize, role),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      return allPages.length + 1;
    },
  });
};

/**
 * Fetch all users (Legacy/Simple)
 * @deprecated Use useInfiniteUsers for large lists
 */
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => userService.getAll(1, 100), // Default to first 100
  });
};

/**
 * Fetch a single user by ID
 */
export const useUser = (id: string | undefined) => {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: () => userService.getById(id!),
    enabled: !!id,
  });
};

/**
 * Fetch users by role
 */
export const useUsersByRole = (role: UserRole) => {
  return useQuery({
    queryKey: userKeys.byRole(role),
    queryFn: () => userService.getByRole(role),
  });
};

/**
 * Fetch all clients
 */
export const useClients = () => {
  return useQuery({
    queryKey: userKeys.byRole('Client'),
    queryFn: () => userService.getClients(),
  });
};

/**
 * Fetch all editors
 */
export const useEditors = () => {
  return useQuery({
    queryKey: userKeys.byRole('Editor'),
    queryFn: () => userService.getEditors(),
  });
};

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; email: string; role: UserRole; password?: string; phone?: string }) =>
      userService.create(data),
    onSuccess: (newUser) => {
      // Invalidate all user queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success(`Usuário ${newUser.name} criado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });
};

/**
 * Update an existing user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userService.update(id, data),
    onSuccess: (updatedUser) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(updatedUser.id) });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar usuário');
    },
  });
};

/**
 * Delete a user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Usuário removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover usuário');
    },
  });
};
