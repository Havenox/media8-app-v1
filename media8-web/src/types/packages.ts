import { VideoFormat, VideoFormatTier } from './api';

export type PackageCategory = 'assinatura' | 'pacote' | 'avulso';

export interface Package {
  id: string;
  name: string;
  category: PackageCategory;
  price: number;
  videoQuantity: number;
  maxDurationSeconds: number; // Max duration per video in seconds
  validityDays: number | null; // null = no expiration (subscription renews)
  loyaltyMonths: number; // 0 = no loyalty
  deliveryDays: number; // 0 = to be agreed upon
  supportedFormats?: VideoFormat[]; // NOVO: Formatos suportados (Fase 0)
  description?: string;
  features: string[];
  disclaimer?: string; // Disclaimer text (e.g., "Deadline agreed in advance")
  badge?: string; // Optional badge (e.g., "Best Seller", "New")
  isHighlighted?: boolean; // Highlight on landing page
  isPublic: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface ClientPackageAssignment {
  id: string;
  packageId: string;
  clientId: string;
  assignedBy: string; // Admin ID who assigned
  assignedAt: string;
  activatedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface CreatePackageRequest {
  name: string;
  category: PackageCategory;
  price: number;
  videoQuantity: number;
  maxDurationSeconds: number;
  validityDays: number | null;
  loyaltyMonths: number;
  deliveryDays: number;
  supportedFormatsIds?: string[]; // NOVO: IDs dos formatos suportados (Fase 0)
  description?: string;
  features: string[];
  disclaimer?: string;
  badge?: string;
  isHighlighted?: boolean;
  isPublic?: boolean;
}

export interface AssignPackageRequest {
  packageId: string;
  clientId: string;
}
