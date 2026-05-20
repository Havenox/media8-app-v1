import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from '../useOffers';
import * as offerServiceModule from '@/services/offerService';
import { toast } from 'sonner';

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do service
vi.mock('@/services/offerService', () => ({
  offerService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
};

describe('useOffers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar dados do service', async () => {
    const mockOffers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Plano Mensal',
        slug: 'plano-mensal',
        contractType: 'Assinatura',
        price: 99.90,
        videoQuantity: 4,
        maxDurationSeconds: 180,
        validityDays: 30,
        loyaltyMonths: 0,
        deliveryDays: 7,
        isPublic: true,
        features: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    vi.mocked(offerServiceModule.offerService.getAll).mockResolvedValue(mockOffers as any);

    const { result } = renderHook(() => useOffers(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockOffers);
    expect(offerServiceModule.offerService.getAll).toHaveBeenCalled();
  });
});

describe('useCreateOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve disparar toast de sucesso e invalidar cache no sucesso', async () => {
    const mockOffer = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Nova Oferta',
      slug: 'nova-oferta',
      contractType: 'Avulso',
      price: 149.90,
      videoQuantity: 1,
      maxDurationSeconds: 180,
      validityDays: 7,
      loyaltyMonths: 0,
      deliveryDays: 10,
      features: [],
      isPublic: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    vi.mocked(offerServiceModule.offerService.create).mockResolvedValue(mockOffer as any);

    const { result } = renderHook(() => useCreateOffer(), { wrapper });

    await result.current.mutateAsync({
      name: 'Nova Oferta',
      slug: 'nova-oferta',
      contractType: 'Avulso',
      price: 149.90,
      videoQuantity: 1,
      maxDurationSeconds: 180,
      validityDays: 7,
      loyaltyMonths: 0,
      deliveryDays: 10,
      features: [],
      isPublic: true,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalledWith('Oferta "Nova Oferta" criada com sucesso!');
  });
});

describe('useUpdateOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve atualizar oferta e invalidar cache', async () => {
    const mockOffer = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Oferta Atualizada',
      slug: 'plano-mensal',
      contractType: 'Assinatura',
      price: 199.90,
      videoQuantity: 4,
      maxDurationSeconds: 180,
      validityDays: 30,
      loyaltyMonths: 0,
      deliveryDays: 7,
      isPublic: true,
      features: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };

    vi.mocked(offerServiceModule.offerService.update).mockResolvedValue(mockOffer as any);

    const { result } = renderHook(() => useUpdateOffer(), { wrapper });

    await result.current.mutateAsync({
      id: '11111111-1111-1111-1111-111111111111',
      data: { name: 'Oferta Atualizada', price: 199.90 },
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Oferta atualizada com sucesso!');
    });
  });
});

describe('useDeleteOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve deletar oferta e invalidar cache', async () => {
    vi.mocked(offerServiceModule.offerService.delete).mockResolvedValue();

    const { result } = renderHook(() => useDeleteOffer(), { wrapper });

    await result.current.mutateAsync('11111111-1111-1111-1111-111111111111');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Oferta removida com sucesso!');
    });
  });
});
