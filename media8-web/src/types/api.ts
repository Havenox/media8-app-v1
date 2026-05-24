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
// PascalCase Pattern - Backend .NET DTO Alignment
export type VideoFormatTier = 'Standard' | 'Premium' | 'GodMode';

export interface VideoFormat {
  Id: string;
  Name: string;
  Slug: string;
  MaxDurationSeconds: number;
  Tier: VideoFormatTier;
  EditingStyleId?: string;
  IsActive: boolean;
  CanDeletePermanently?: boolean;
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
// PascalCase Pattern - Backend .NET DTO Alignment
export interface ServiceBalanceLot {
  Id: string;
  UserId: string;
  VideoFormatId: string;
  Quantity: number;
  RemainingQuantity: number;
  PurchasedAt: string;
  ExpiresAt?: string | null;
  Source: 'Purchase' | 'Subscription' | 'Promo' | 'Gift';
  AssignmentId?: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  User?: User;
  Contract?: any;
  VideoFormat?: VideoFormat;
}

export interface Order {
  Id: string;
  ClientId: string;
  Client?: User;
  EditorId?: string;
  Editor?: User;
  Title: string;
  Briefing: string;
  SourceFilesUrl: string;
  FinalVideoUrl?: string;
  Status: OrderStatus;
  Deadline: string;
  CreatedAt: string;
  UpdatedAt: string;
  VideoFormatId: string;
  ServiceBalanceLotId?: string;
  AssignmentId?: string;
}

export interface CreateOrderRequest {
  Title: string;
  Briefing: string;
  SourceFilesUrl: string;
  Deadline: string;
  VideoFormatId: string;
  ServiceBalanceLotId: string;
}

export interface UpdateOrderRequest {
  Title?: string;
  Briefing?: string;
  SourceFilesUrl?: string;
  FinalVideoUrl?: string;
  Status?: OrderStatus;
  EditorId?: string;
  Deadline?: string;
}

// Order Timeline
// PascalCase Pattern - Backend .NET DTO Alignment
export interface OrderTimeline {
  Id: string;
  OrderId: string;
  UserId: string;
  User?: User;
  ActionType: TimelineActionType;
  Content: string;
  Timestamp: string;
}

export interface CreateTimelineEntryRequest {
  OrderId: string;
  ActionType: TimelineActionType;
  Content: string;
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
