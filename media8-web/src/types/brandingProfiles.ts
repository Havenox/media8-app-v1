// ==========================================
// MEDIA 8 - Branding Profile Types (DTOs)
// BrandingProfile (formerly VisualIdentityProfile) & EditingProfile
// ==========================================

// Branding Profile (formerly Visual Identity Profile)
// PascalCase Pattern - Backend .NET DTO Alignment
export interface BrandingProfile {
  Id: string;
  UserId: string;
  SequentialId?: number;
  Name: string;
  SocialHandles: string;
  BrandColors: string;
  BrandFonts: string;
  TargetAudience: string;
  BrandAssetsUrl: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateBrandingProfileRequest {
  Name: string;
  SocialHandles: string;
  BrandColors: string;
  BrandFonts: string;
  TargetAudience: string;
  BrandAssetsUrl: string;
}

export interface UpdateBrandingProfileRequest {
  Name?: string;
  SocialHandles?: string;
  BrandColors?: string;
  BrandFonts?: string;
  TargetAudience?: string;
  BrandAssetsUrl?: string;
}

// Editing Profile
// PascalCase Pattern - Backend .NET DTO Alignment
export interface EditingProfile {
  Id: string;
  UserId: string;
  SequentialId?: number;
  Name: string;
  ReferenceUrl: string;
  CutGuidelines: string;
  ThumbnailPreference: string;
  MusicStyle: string;
  UseVideoHook: boolean;
  TextHighlightStyle: string;
  GeneralNotes: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateEditingProfileRequest {
  Name: string;
  ReferenceUrl: string;
  CutGuidelines: string;
  ThumbnailPreference: string;
  MusicStyle: string;
  UseVideoHook: boolean;
  TextHighlightStyle: string;
  GeneralNotes: string;
}

export interface UpdateEditingProfileRequest {
  Name?: string;
  ReferenceUrl?: string;
  CutGuidelines?: string;
  ThumbnailPreference?: string;
  MusicStyle?: string;
  UseVideoHook?: boolean;
  TextHighlightStyle?: string;
  GeneralNotes?: string;
}
