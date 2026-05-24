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
  CanDeletePermanently?: boolean;
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
// Request DTOs — PascalCase to match .NET backend
// ==========================================
export interface CreateOfferRequest {
  Name: string;
  Slug: string;
  ContractType: ContractType;
  Price: number;
  VideoQuantity: number;
  MaxDurationSeconds: number;
  ValidityDays?: number;
  LoyaltyMonths: number;
  DeliveryDays: number;
  VideoFormatId?: string;
  EditingStyleId?: string;
  Description?: string;
  Features: string[];
  Disclaimer?: string;
  Badge?: string;
  IsPublic?: boolean;
}

export interface UpdateOfferRequest {
  Name?: string;
  Slug?: string;
  ContractType?: ContractType;
  Price?: number;
  VideoQuantity?: number;
  MaxDurationSeconds?: number;
  ValidityDays?: number;
  LoyaltyMonths?: number;
  DeliveryDays?: number;
  VideoFormatId?: string;
  EditingStyleId?: string;
  Description?: string;
  Features?: string[];
  Disclaimer?: string;
  Badge?: string;
  IsPublic?: boolean;
}

export interface CreateClientContractRequest {
  OfferId: string;
  ClientId: string;
  AssignedByUserId: string;
}

export interface UpdateClientContractRequest {
  Status?: AssignmentStatus;
  ExpiresAt?: string;
}

// ==========================================
// Response DTOs — PascalCase
// ==========================================
export type OfferResponse = Offer;

export type ClientContractResponse = ClientContract;
