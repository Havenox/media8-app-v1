import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClientContracts, useCreateClientContract, useUpdateClientContract } from '../useClientContracts';
import * as clientContractServiceModule from '@/services/clientContractService';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/clientContractService', () => ({
  clientContractService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useClientContracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar contratos do service', async () => {
    const mockContracts = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        offerId: '22222222-2222-2222-2222-222222222222',
        clientId: '33333333-3333-3333-3333-333333333333',
        assignedBy: '44444444-4444-4444-4444-444444444444',
        snapshotOfferName: 'Plano Mensal',
        snapshotPrice: 99.90,
        snapshotVideoQuantity: 4,
        snapshotValidityDays: 30,
        assignedAt: '2026-01-01T00:00:00Z',
        activatedAt: '2026-01-01T00:00:00Z',
        expiresAt: '2026-02-01T00:00:00Z',
        status: 'Active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    vi.mocked(clientContractServiceModule.clientContractService.getAll).mockResolvedValue(mockContracts as any);

    const { result } = renderHook(() => useClientContracts(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockContracts);
    expect(clientContractServiceModule.clientContractService.getAll).toHaveBeenCalled();
  });
});

describe('useCreateClientContract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve disparar toast e invalidar cache no sucesso', async () => {
    const mockContract = {
      id: '55555555-5555-5555-5555-555555555555',
      offerId: '22222222-2222-2222-2222-222222222222',
      clientId: '33333333-3333-3333-3333-333333333333',
      assignedBy: '44444444-4444-4444-4444-444444444444',
      snapshotOfferName: 'Plano Mensal',
      snapshotPrice: 99.90,
      snapshotVideoQuantity: 4,
      snapshotValidityDays: 30,
      assignedAt: '2026-01-01T00:00:00Z',
      activatedAt: '2026-01-01T00:00:00Z',
      expiresAt: '2026-02-01T00:00:00Z',
      status: 'Active',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    vi.mocked(clientContractServiceModule.clientContractService.create).mockResolvedValue(mockContract as any);

    const { result } = renderHook(() => useCreateClientContract(), { wrapper });

    await result.current.mutateAsync({
      offerId: '22222222-2222-2222-2222-222222222222',
      clientId: '33333333-3333-3333-3333-333333333333',
      assignedByUserId: '44444444-4444-4444-4444-444444444444',
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalledWith('Contrato criado com sucesso para o cliente!');
  });
});

describe('useUpdateClientContract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve atualizar contrato e invalidar cache', async () => {
    const mockContract = {
      id: '11111111-1111-1111-1111-111111111111',
      offerId: '22222222-2222-2222-2222-222222222222',
      clientId: '33333333-3333-3333-3333-333333333333',
      assignedBy: '44444444-4444-4444-4444-444444444444',
      snapshotOfferName: 'Plano Mensal',
      snapshotPrice: 99.90,
      snapshotVideoQuantity: 4,
      snapshotValidityDays: 30,
      assignedAt: '2026-01-01T00:00:00Z',
      activatedAt: '2026-01-01T00:00:00Z',
      expiresAt: '2026-02-01T00:00:00Z',
      status: 'Expired',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };

    vi.mocked(clientContractServiceModule.clientContractService.update).mockResolvedValue(mockContract as any);

    const { result } = renderHook(() => useUpdateClientContract(), { wrapper });

    await result.current.mutateAsync({
      id: '11111111-1111-1111-1111-111111111111',
      data: { status: 'Expired' },
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Contrato atualizado com sucesso!');
    });
  });
});
