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
export interface VideoFormat {
  Id: string;
  Name: string;
  Slug: string;
  MaxDurationSeconds: number;
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

export interface UserLoginRequest {
  Email: string;
  Password: string;
}

export interface UserLoginResponse {
  Token: string;
  User: User;
}

export interface UserRegisterRequest {
  Name: string;
  Email: string;
  Password: string;
  Role?: UserRole;
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
  Contract?: {
    SnapshotOfferName: string;
  };
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
  ServiceBalanceLotId?: string;
  AssignmentId?: string;
}

export interface CreateOrderRequest {
  Title: string;
  Briefing: string;
  SourceFilesUrl: string;
  Deadline: string;
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
  TotalOrders: number;
  PendingOrders: number;
  InProgressOrders: number;
  CompletedOrders: number;
}

export interface UserStats {
  TotalUsers: number;
  TotalAdmins: number;
  TotalClients: number;
  TotalEditors: number;
}
