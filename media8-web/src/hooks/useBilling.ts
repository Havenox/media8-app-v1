import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { InvoiceStatus, InvoicesPagedResponse, ConfirmPaymentRequest } from '@/types/billing';

export function useInvoices(
  page: number,
  pageSize: number,
  status?: InvoiceStatus | null,
  search?: string
) {
  return useQuery({
    queryKey: ['admin', 'billing', 'invoices', page, pageSize, status, search],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        pageSize,
      };

      if (status) {
        params.status = status;
      }

      if (search) {
        params.search = search;
      }

      const response = await api.get<InvoicesPagedResponse>('/admin/billing/invoices', { params });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    retry: 1,
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      request,
    }: {
      invoiceId: string;
      request: ConfirmPaymentRequest;
    }) => {
      const response = await api.post(
        `/admin/billing/invoices/${invoiceId}/confirm-payment`,
        request
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalida a lista de faturas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'invoices'] });
    },
  });
}
