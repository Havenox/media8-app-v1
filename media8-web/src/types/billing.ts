export type InvoiceStatus = 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  Id: string;
  ClientId: string;
  ClientName: string;
  ClientEmail: string;
  ContractId?: string | null;
  ContractOfferName?: string | null;
  SequentialId?: number;
  Description: string;
  Amount: number;
  CycleNumber?: number | null;
  DueDate: string;
  Status: InvoiceStatus;
  PaidAt?: string | null;
  PaymentMethod?: string | null;
  GatewayInvoiceId?: string | null;
  TransactionId?: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ConfirmPaymentRequest {
  PaymentMethod: string;
  TransactionId?: string;
}

export interface InvoicesPagedResponse {
  Items: Invoice[];
  TotalCount: number;
  Page: number;
  PageSize: number;
}
