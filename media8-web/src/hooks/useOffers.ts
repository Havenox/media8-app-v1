import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Offer, CreateOfferRequest, UpdateOfferRequest, OfferResponse } from '@/types/offers';
import { offerService } from '@/services/offerService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';

// ==========================================
// QUERY KEYS
// ==========================================
export const offerKeys = {
  all: ['offers'] as const,
  lists: () => [...offerKeys.all, 'list'] as const,
  details: () => [...offerKeys.all, 'detail'] as const,
  detail: (id: string) => [...offerKeys.details(), id] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Fetch all offers
 */
export const useOffers = (pageSize = 20, search?: string) => {
  return useQuery({
    queryKey: [...offerKeys.lists(), { pageSize, search }],
    queryFn: () => offerService.getAll(1, pageSize, search),
  });
};

/**
 * Fetch a single offer by ID
 */
export const useOffer = (id: string | undefined) => {
  return useQuery({
    queryKey: offerKeys.detail(id!),
    queryFn: () => offerService.getById(id!),
    enabled: !!id,
  });
};

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a new offer
 */
export const useCreateOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOfferRequest) => offerService.create(data),
    onSuccess: (newOffer) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
      toast.success(`Oferta "${newOffer.name}" criada com sucesso!`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Update an existing offer
 */
export const useUpdateOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOfferRequest }) =>
      offerService.update(id, data),
    onSuccess: (updatedOffer) => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
      queryClient.invalidateQueries({ queryKey: offerKeys.detail(updatedOffer.id) });
      toast.success('Oferta atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
* Delete an offer
*/
export const useDeleteOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) => offerService.delete(id, permanent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
      toast.success('Oferta removida com sucesso!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
