// ==========================================
// MEDIA 8 - Service Inventory Types
// Sistema de Saldos/Inventário de Serviços
// ==========================================
// Fase 0: Migração para Catálogo Dinâmico (VideoFormat)
// Fase 3: Migração para Offers/ClientContracts (Snapshot Pattern)
// ==========================================

import { ClientContract } from './offers';

export type ServiceCategory = 'reels' | 'youtube' | 'pacote' | 'avulso';

// ==========================================
// NOVO: Interface Unificada vinda da API /ServiceBalances/MyBalances
// Snapshot Pattern - Campos em PascalCase nativo (.NET)
// ==========================================
export interface UnifiedServiceBalance {
  Id: string; // Balance Lot ID
  // SNAPSHOT COMERCIAL (Imutável)
  SnapshotOfferName: string; // e.g. "Plano Growth"
  SnapshotVideoQuantity: number; // Quantidade de vídeos no snapshot
  ContractType: string; // "Assinatura" ou "Pacote"
  SnapshotWarrantyDays?: number; // Tempo de fidelidade em dias
  // SNAPSHOT TÉCNICO (Imutável - Sem FKs)
  SnapshotVideoFormatName: string; // e.g. "Reels Premium"
  SnapshotEditingStyleName: string; // e.g. "Corporativo"
  SnapshotMaxDurationSeconds: number; // Duração máxima em segundos
  // DADOS DE ESTADO DO LOTE
  RemainingQuantity: number; // Saldo restante
  TotalQuantity: number; // Total original
  ExpiresAt: string | null; // Data de expiração
  PurchaseDate: string; // Data de compra
  Status: string; // "active", "expired", "depleted"
  InvoiceId: string | null;
  InvoiceStatus: string | null;
  ContractId?: string;
}

// Resultado do consumo de serviço
export interface ConsumeResult {
  success: boolean;
  consumedFromLotId?: string;
  remainingInLot?: number;
  error?: 'NO_BALANCE' | 'EXPIRED' | 'NOT_FOUND';
}

// ==========================================
// EDITING STYLES TYPES
// PascalCase Pattern - Backend .NET DTO Alignment
// ==========================================

export interface EditingStyle {
  Id: string;
  Name: string;
  Description?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  CanDeletePermanently?: boolean;
}

export interface CreateEditingStyleRequest {
  Name: string;
  Description?: string;
}

export interface UpdateEditingStyleRequest {
  Name?: string;
  Description?: string;
  IsActive?: boolean;
}

// ==========================================
// LEGACY COMPATIBILITY (Used by ServicesPage, ServiceBalanceCard)
// TODO: Refactor these pages to use UnifiedServiceBalance
// ==========================================

export interface ServiceBalanceAggregated {
  serviceType: string;
  name: string;
  category: ServiceCategory;
  planName?: string;
  totalQuantity: number;
  isZeroed: boolean;
  isExpired: boolean;
  isSubscription: boolean;
  daysUntilRenewal?: number;
  daysUntilExpiry?: number;
  lots?: any[];
}

