// ==========================================
// MEDIA 8 - API Types (DTOs)
// Aligned with Backend C# .NET Models
// ==========================================

// Enums
export type UserRole = 'Admin' | 'Client' | 'Editor';

export type OrderStatus =
  | 'Pending'
  | 'InProgress'
  | 'InReview'
  | 'ChangesRequested'
  | 'Approved';

export type TimelineActionType =
  | 'StatusChange'
  | 'Comment'
  | 'VersionUpload';

// User
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  phone?: string;
  preferences?: string; // JSON string
}

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
  serviceType?: import('./services').ServiceType; // Link to service inventory
}

export interface CreateOrderRequest {
  title: string;
  briefing: string;
  sourceFilesUrl: string;
  deadline: string;
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
