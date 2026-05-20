import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { offerService } from '../offerService';
import { api } from '@/lib/api';
import type { CreateOfferRequest } from '@/types/offers';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('OfferService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAll', () => {
    it('deve chamar a URL correta e retornar ofertas no GetAll', async () => {
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

      vi.mocked(api.get).mockResolvedValue({ data: mockOffers });

      const result = await offerService.getAll(1, 20, 'plano');

      expect(api.get).toHaveBeenCalledWith('/offers?page=1&pageSize=20&search=plano');
      expect(result).toEqual(mockOffers);
    });

    it('deve retornar array vazio quando não houver ofertas', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      const result = await offerService.getAll();

      expect(api.get).toHaveBeenCalledWith('/offers?page=1&pageSize=20');
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('deve chamar a URL correta e retornar uma oferta por ID', async () => {
      const mockOffer = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Pacote 10 Edições',
        slug: 'pacote-10-edicoes',
        contractType: 'Pacote',
        price: 499.90,
        videoQuantity: 10,
        maxDurationSeconds: 180,
        validityDays: 90,
        loyaltyMonths: 0,
        deliveryDays: 5,
        isPublic: true,
        features: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockOffer });

      const result = await offerService.getById('11111111-1111-1111-1111-111111111111');

      expect(api.get).toHaveBeenCalledWith('/offers/11111111-1111-1111-1111-111111111111');
      expect(result).toEqual(mockOffer);
    });

    it('deve retornar null quando a oferta não for encontrada', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: null });

      const result = await offerService.getById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve enviar payload correto no Create', async () => {
      const createRequest: CreateOfferRequest = {
        name: 'Nova Oferta',
        slug: 'nova-oferta',
        contractType: 'Avulso',
        price: 149.90,
        videoQuantity: 1,
        maxDurationSeconds: 180,
        validityDays: 7,
        loyaltyMonths: 0,
        deliveryDays: 10,
        features: ['Recurso 1', 'Recurso 2'],
        isPublic: true,
      };

      const mockResponse = {
        id: '22222222-2222-2222-2222-222222222222',
        ...createRequest,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const result = await offerService.create(createRequest);

      expect(api.post).toHaveBeenCalledWith('/offers', createRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('deve atualizar uma oferta existente', async () => {
      const updateRequest = {
        name: 'Oferta Atualizada',
        price: 199.90,
      };

      const mockResponse = {
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

      vi.mocked(api.put).mockResolvedValue({ data: mockResponse });

      const result = await offerService.update('11111111-1111-1111-1111-111111111111', updateRequest);

      expect(api.put).toHaveBeenCalledWith('/offers/11111111-1111-1111-1111-111111111111', updateRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('deve deletar uma oferta', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: undefined });

      await offerService.delete('11111111-1111-1111-1111-111111111111');

      expect(api.delete).toHaveBeenCalledWith('/offers/11111111-1111-1111-1111-111111111111');
    });
  });
});
