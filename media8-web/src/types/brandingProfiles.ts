// ==========================================
// MEDIA 8 - Branding Profile Types (DTOs)
// BrandingProfile (formerly VisualIdentityProfile) & EditingProfile
// ==========================================

// Branding Profile (formerly Visual Identity Profile)
export interface BrandingProfile {
  id: string;
  userId: string;
  name: string;
  socialHandles: string;
  brandColors: string;
  brandFonts: string;
  targetAudience: string;
  brandAssetsUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandingProfileRequest {
  name: string;
  socialHandles: string;
  brandColors: string;
  brandFonts: string;
  targetAudience: string;
  brandAssetsUrl: string;
}

export interface UpdateBrandingProfileRequest {
  name?: string;
  socialHandles?: string;
  brandColors?: string;
  brandFonts?: string;
  targetAudience?: string;
  brandAssetsUrl?: string;
}

// Editing Profile
export interface EditingProfile {
  id: string;
  userId: string;
  name: string;
  referenceUrl: string;
  cutGuidelines: string;
  thumbnailPreference: string;
  musicStyle: string;
  useVideoHook: boolean;
  textHighlightStyle: string;
  generalNotes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEditingProfileRequest {
  name: string;
  referenceUrl: string;
  cutGuidelines: string;
  thumbnailPreference: string;
  musicStyle: string;
  useVideoHook: boolean;
  textHighlightStyle: string;
  generalNotes: string;
}

export interface UpdateEditingProfileRequest {
  name?: string;
  referenceUrl?: string;
  cutGuidelines?: string;
  thumbnailPreference?: string;
  musicStyle?: string;
  useVideoHook?: boolean;
  textHighlightStyle?: string;
  generalNotes?: string;
}
