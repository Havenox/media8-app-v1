// ==========================================
// MEDIA 8 - Profile Types (DTOs)
// VisualIdentityProfile & EditingProfile
// ==========================================

// Visual Identity Profile
export interface VisualIdentityProfile {
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

export interface CreateVisualIdentityProfileRequest {
  name: string;
  socialHandles: string;
  brandColors: string;
  brandFonts: string;
  targetAudience: string;
  brandAssetsUrl: string;
}

export interface UpdateVisualIdentityProfileRequest {
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
