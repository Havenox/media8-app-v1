// ==========================================
// MEDIA 8 - API Types (DTOs)
// Aligned with Backend C# .NET Models
// ==========================================

// Enums
export type UserRole = 'Admin' | 'Client' | 'Editor';

export type OrderStatus =
| 'Draft'
| 'Pending'
| 'Processing'
| 'InProgress'
| 'InReview'
| 'ChangesRequested'
| 'Approved'
| 'Completed'
| 'Cancelled';

export type TimelineActionType =
  | 'StatusChange'
  | 'Comment'
  | 'VersionUpload';

// Video Format (Dynamic Catalog - Fase 0)
export type VideoFormatTier = 'Standard' | 'Premium' | 'GodMode';

export interface VideoFormat {
id: string;
name: string;
slug: string;
maxDurationSeconds: number;
tier: VideoFormatTier;
editingStyleId?: string;
isActive: boolean;
canDeletePermanently?: boolean;
}

// User
// PascalCase Pattern - Backend .NET DTO Alignment
export interface User {
  Id: string;
  Name: string;
  Email: string;
  Role: UserRole;
  CreatedAt: string;
  UpdatedAt: string;
  IsActive: boolean;
  Bio?: string;
  Phone?: string;
  Preferences?: string; // JSON string
  AvatarUrl?: string;
  ActivePackage?: {
    Name: string;
    VideoQuantity: number;
    AdditionalPackagesCount: number;
    ExpiresAt?: string;
  };
}

// Legacy camelCase aliases for backward compatibility (DEPRECATED)
// These will be removed after full PascalCase migration
export type UserCamelCase = Omit<User, 'Id' | 'Name' | 'Email' | 'Role' | 'CreatedAt' | 'UpdatedAt' | 'IsActive'> & {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  token: string;
  user: User;
}

export interface UserRegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

// Order
export interface ServiceBalanceLot {
id: string;
userId: string;
videoFormatId: string;
quantity: number;
remainingQuantity: number;
purchasedAt: string;
expiresAt?: string | null;
source: 'Purchase' | 'Subscription' | 'Promo' | 'Gift';
assignmentId?: string | null;
createdAt: string;
updatedAt: string;
user?: User;
contract?: any;
videoFormat?: VideoFormat;
}

export interface Order {
id: string;
clientId: string;
client?: User;
editorId?: string;
editor?: User;
title: string;
briefing: string;
sourceFilesUrl: string;
finalVideoUrl?: string;
status: OrderStatus;
deadline: string;
createdAt: string;
updatedAt: string;
videoFormatId: string;
serviceBalanceLotId?: string;
assignmentId?: string;
}

export interface CreateOrderRequest {
title: string;
briefing: string;
sourceFilesUrl: string;
deadline: string;
videoFormatId: string;
serviceBalanceLotId: string;
}

export interface UpdateOrderRequest {
  title?: string;
  briefing?: string;
  sourceFilesUrl?: string;
  finalVideoUrl?: string;
  status?: OrderStatus;
  editorId?: string;
  deadline?: string;
}

// Order Timeline
export interface OrderTimeline {
  id: string;
  orderId: string;
  userId: string;
  user?: User;
  actionType: TimelineActionType;
  content: string;
  timestamp: string;
}

export interface CreateTimelineEntryRequest {
  orderId: string;
  actionType: TimelineActionType;
  content: string;
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
}

export interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  totalClients: number;
  totalEditors: number;
}
