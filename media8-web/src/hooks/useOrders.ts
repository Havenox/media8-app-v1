import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, OrderStatus, CreateOrderRequest, ServiceBalanceLot } from '@/types/api';
import { orderService } from '@/services/orderService';
import { toast } from 'sonner';

// ==========================================
// QUERY KEYS
// ==========================================
export const orderKeys = {
all: ['orders'] as const,
lists: () => [...orderKeys.all, 'list'] as const,
list: (filters: Record<string, string>) => [...orderKeys.lists(), filters] as const,
details: () => [...orderKeys.all, 'detail'] as const,
detail: (id: string) => [...orderKeys.details(), id] as const,
byClient: (clientId: string) => [...orderKeys.all, 'client', clientId] as const,
byEditor: (editorId: string) => [...orderKeys.all, 'editor', editorId] as const,
byStatus: (status: OrderStatus) => [...orderKeys.all, 'status', status] as const,
stats: () => [...orderKeys.all, 'stats'] as const,
availableBalances: () => [...orderKeys.all, 'available-balances'] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Fetch all orders
 */
export const useOrders = () => {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: () => orderService.getAll(),
  });
};

/**
 * Fetch a single order by ID
 */
export const useOrder = (id: string | undefined) => {
  return useQuery({
    queryKey: orderKeys.detail(id!),
    queryFn: () => orderService.getById(id!),
    enabled: !!id,
  });
};

/**
 * Fetch orders by client ID
 * Only executes when clientId is provided (conditional query)
 */
export const useOrdersByClient = (clientId: string | undefined) => {
  return useQuery({
    queryKey: orderKeys.byClient(clientId!),
    queryFn: () => orderService.getByClient(clientId!),
    enabled: !!clientId, // ❌ NÃO executa se clientId for undefined/null
  });
};

/**
 * Fetch orders by editor ID
 * Only executes when editorId is provided (conditional query)
 */
export const useOrdersByEditor = (editorId: string | undefined) => {
  return useQuery({
    queryKey: orderKeys.byEditor(editorId!),
    queryFn: () => orderService.getByEditor(editorId!),
    enabled: !!editorId, // ❌ NÃO executa se editorId for undefined/null
  });
};

/**
 * Fetch orders by status
 */
export const useOrdersByStatus = (status: OrderStatus) => {
  return useQuery({
    queryKey: orderKeys.byStatus(status),
    queryFn: () => orderService.getByStatus(status),
  });
};

/**
 * Fetch order statistics for dashboard
 */
export const useOrderStats = () => {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: () => orderService.getStats(),
  });
};

// ==========================================
// MUTATIONS
// ==========================================

interface CreateOrderData {
  Title: string;
  Briefing: string;
  SourceFilesUrl: string;
  Deadline: string;
  ServiceBalanceLotId: string;
  BrandingProfileId: string;
  EditingProfileId: string;
}

/**
 * Create a new order
 */
export const useCreateOrder = () => {
const queryClient = useQueryClient();

return useMutation({
mutationFn: (data: CreateOrderData) => orderService.create(data),
onSuccess: (newOrder) => {
// Invalidate all order queries and available balances
queryClient.invalidateQueries({ queryKey: orderKeys.all });
queryClient.invalidateQueries({ queryKey: orderKeys.availableBalances() });
toast.success('Pedido criado com sucesso!');
},
onError: (error: Error) => {
toast.error(error.message || 'Erro ao criar pedido');
},
});
};

/**
 * Update an existing order
 */
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) => 
      orderService.update(id, data),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(updatedOrder.Id) });
      toast.success('Pedido atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar pedido');
    },
  });
};

/**
 * Update order status
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => 
      orderService.updateStatus(id, status),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(updatedOrder.Id) });
      toast.success(`Status atualizado para ${updatedOrder.Status}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
};

/**
 * Assign an editor to an order
 */
export const useAssignEditor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, editorId }: { orderId: string; editorId: string }) => 
      orderService.assignEditor(orderId, editorId),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(updatedOrder.Id) });
      toast.success('Editor atribuído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atribuir editor');
    },
  });
};

/**
* Delete an order
*/
export const useDeleteOrder = () => {
const queryClient = useQueryClient();

return useMutation({
mutationFn: (id: string) => orderService.delete(id),
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: orderKeys.all });
toast.success('Pedido removido com sucesso!');
},
onError: (error: Error) => {
toast.error(error.message || 'Erro ao remover pedido');
},
});
};

/**
* Cancel an order with refund
*/
export const useCancelOrder = () => {
const queryClient = useQueryClient();

return useMutation({
mutationFn: (id: string) => orderService.cancel(id),
onSuccess: (data) => {
queryClient.invalidateQueries({ queryKey: orderKeys.all });
queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.Id) });
toast.success('Pedido cancelado com sucesso! Saldo estornado.');
},
onError: (error: Error) => {
toast.error(error.message || 'Erro ao cancelar pedido');
},
});
};

/**
 * Fetch available service balances for order creation
 */
export const useAvailableBalances = () => {
  return useQuery({
    queryKey: orderKeys.availableBalances(),
    queryFn: () => orderService.getAvailableBalances(),
  });
};

/**
 * Fetch cancellation window from settings
 */
export const useCancellationWindow = () => {
  return useQuery({
    queryKey: ['settings', 'CancellationWindowHours'] as const,
    queryFn: () => orderService.getCancellationWindow(),
  });
};
