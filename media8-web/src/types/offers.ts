// ==========================================
// MEDIA 8 - Offers & ClientContracts Types
// Sistema de Ofertas Comerciais e Contratos
// ==========================================

import { VideoFormat } from './api';

// ==========================================
// Enums do Backend (espelhando C# enums)
// ==========================================
export type ContractType = 'Avulso' | 'Pacote' | 'Assinatura';

export type AssignmentStatus = 'Active' | 'Expired' | 'Cancelled';

// ==========================================
// Offer - Produto comercial
// PascalCase Pattern - Backend .NET DTO Alignment
// ==========================================
export interface Offer {
  Id: string;
  Name: string;
  Slug: string;
  ContractType: ContractType;
  Price: number;
  VideoQuantity: number;
  MaxDurationSeconds: number;
  ValidityDays: number | null;
  LoyaltyMonths: number;
  DeliveryDays: number;
  VideoFormatId?: string;
  EditingStyleId?: string;
  Description?: string;
  Features: string[];
  Disclaimer?: string;
  Badge?: string;
  IsPublic: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

// ==========================================
// ClientContract - Contrato com Snapshot
// PascalCase Pattern - Backend .NET DTO Alignment
// ==========================================
export interface ClientContract {
  Id: string;
  OfferId: string;
  ClientId: string;
  AssignedBy: string;

  // Snapshot Imutável (cópia dos dados da oferta no momento da contratação)
  SnapshotOfferName?: string;
  SnapshotVideoQuantity?: number;
  SnapshotPrice?: number;
  SnapshotValidityDays?: number;

  AssignedAt: string;
  ActivatedAt: string;
  ExpiresAt?: string;
  Status: AssignmentStatus;
  CreatedAt: string;
  UpdatedAt: string;

  // Navegação (opcional)
  Offer?: Offer;
}

// ==========================================
// Request DTOs
// ==========================================
export interface CreateOfferRequest {
  name: string;
  slug: string;
  contractType: ContractType;
  price: number;
  videoQuantity: number;
  maxDurationSeconds: number;
  validityDays?: number;
  loyaltyMonths: number;
  deliveryDays: number;
  videoFormatId?: string;
  editingStyleId?: string;
  description?: string;
  features: string[];
  disclaimer?: string;
  badge?: string;
  isPublic?: boolean;
}

export interface UpdateOfferRequest {
  name?: string;
  slug?: string;
  contractType?: ContractType;
  price?: number;
  videoQuantity?: number;
  maxDurationSeconds?: number;
  validityDays?: number;
  loyaltyMonths?: number;
  deliveryDays?: number;
  videoFormatId?: string;
  editingStyleId?: string;
  description?: string;
  features?: string[];
  disclaimer?: string;
  badge?: string;
  isPublic?: boolean;
}

export interface CreateClientContractRequest {
  offerId: string;
  clientId: string;
  assignedByUserId: string;
}

export interface UpdateClientContractRequest {
  status?: AssignmentStatus;
  expiresAt?: string;
}

// ==========================================
// Response DTOs
// ==========================================
export type OfferResponse = Offer;

export interface ClientContractResponse {
  id: string;
  offerId: string;
  clientId: string;
  assignedBy: string;
  snapshotOfferName?: string;
  snapshotVideoQuantity?: number;
  snapshotPrice?: number;
  snapshotValidityDays?: number;
  assignedAt: string;
  activatedAt: string;
  expiresAt?: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  offer?: Offer;
}
