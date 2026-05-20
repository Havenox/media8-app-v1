import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clientContractService } from '../clientContractService';
import { api } from '@/lib/api';
import type { CreateClientContractRequest } from '@/types/offers';

// Mock do axios instance
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ClientContractService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAll', () => {
    it('deve retornar contratos de um cliente específico', async () => {
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

      vi.mocked(api.get).mockResolvedValue({ data: mockContracts });

      const result = await clientContractService.getAll('33333333-3333-3333-3333-333333333333');

      expect(api.get).toHaveBeenCalledWith('/client-contracts?clientId=33333333-3333-3333-3333-333333333333');
      expect(result).toEqual(mockContracts);
    });

    it('deve retornar todos os contratos quando não houver clientId', async () => {
      const mockContracts = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          offerId: '22222222-2222-2222-2222-222222222222',
          clientId: '33333333-3333-3333-3333-333333333333',
          assignedBy: '44444444-4444-4444-4444-444444444444',
          snapshotOfferName: 'Pacote 10 Edições',
          snapshotPrice: 499.90,
          snapshotVideoQuantity: 10,
          snapshotValidityDays: 90,
          assignedAt: '2026-01-01T00:00:00Z',
          activatedAt: '2026-01-01T00:00:00Z',
          expiresAt: '2026-04-01T00:00:00Z',
          status: 'Active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ];

      vi.mocked(api.get).mockResolvedValue({ data: mockContracts });

      const result = await clientContractService.getAll();

      expect(api.get).toHaveBeenCalledWith('/client-contracts?');
      expect(result).toEqual(mockContracts);
    });
  });

  describe('getById', () => {
    it('deve retornar um contrato específico por ID', async () => {
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
        status: 'Active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockContract });

      const result = await clientContractService.getById('11111111-1111-1111-1111-111111111111');

      expect(api.get).toHaveBeenCalledWith('/client-contracts/11111111-1111-1111-1111-111111111111');
      expect(result).toEqual(mockContract);
    });
  });

  describe('create', () => {
    it('deve criar um novo contrato com payload correto', async () => {
      const createRequest: CreateClientContractRequest = {
        offerId: '22222222-2222-2222-2222-222222222222',
        clientId: '33333333-3333-3333-3333-333333333333',
        assignedByUserId: '44444444-4444-4444-4444-444444444444',
      };

      const mockResponse = {
        id: '55555555-5555-5555-5555-555555555555',
        ...createRequest,
        snapshotOfferName: 'Plano Mensal',
        snapshotPrice: 99.90,
        snapshotVideoQuantity: 4,
        snapshotValidityDays: 30,
        assignedAt: '2026-01-01T00:00:00Z',
        activatedAt: '2026-01-01T00:00:00Z',
        expiresAt: '2026-02-01T00:00:00Z',
        status: 'Active' as const,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const result = await clientContractService.create(createRequest);

      expect(api.post).toHaveBeenCalledWith('/client-contracts', createRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('deve atualizar status de um contrato', async () => {
      const updateRequest = {
        status: 'Expired' as const,
      };

      const mockResponse = {
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
        status: 'Expired' as const,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      };

      vi.mocked(api.put).mockResolvedValue({ data: mockResponse });

      const result = await clientContractService.update('11111111-1111-1111-1111-111111111111', updateRequest);

      expect(api.put).toHaveBeenCalledWith('/client-contracts/11111111-1111-1111-1111-111111111111', updateRequest);
      expect(result).toEqual(mockResponse);
    });
  });
});
