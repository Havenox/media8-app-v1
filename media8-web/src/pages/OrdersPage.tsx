import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Video,
  Calendar,
  User,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import CancelOrderButton from '@/components/orders/CancelOrderButton';

// Hooks
import { useOrders, useOrdersByClient, useDeleteOrder, useCancellationWindow } from '@/hooks/useOrders';

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // For clients, show only their orders; for admin/editor, show all
  const isClient = user?.Role === 'Client';
  const { data: allOrders = [], isLoading: isLoadingAll } = useOrders();
  const { data: clientOrders = [], isLoading: isLoadingClient } = useOrdersByClient(isClient ? user?.Id : undefined);

  const orders = isClient ? clientOrders : allOrders;
  const isLoading = isClient ? isLoadingClient : isLoadingAll;

  const deleteOrderMutation = useDeleteOrder();
  const { data: cancellationWindowHours } = useCancellationWindow();

  // Filter orders based on search and status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrderMutation.mutateAsync(orderId);
    } catch (error) {
      // Error handled in hook
    }
  };

  const canCancelOrder = (status: string) => {
    return status === 'Draft' || status === 'Pending';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 justify-between">
          <div className="flex gap-4 flex-1">
            <Skeleton className="h-10 flex-1 max-w-md" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Actions */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Pending">Pendente</SelectItem>
              <SelectItem value="InProgress">Em Progresso</SelectItem>
              <SelectItem value="InReview">Em Revisão</SelectItem>
              <SelectItem value="ChangesRequested">Alterações</SelectItem>
              <SelectItem value="Approved">Aprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* New Order Button */}
        <Link to="/orders/new">
          <Button variant="premium">
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>
        </Link>
      </motion.div>

      {/* Orders Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <motion.div key={order.id} variants={itemVariants}>
            <Card variant="elevated" className="hover:border-primary/20 transition-all group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base line-clamp-1">{order.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
<DropdownMenuContent align="end" className="w-48">
<DropdownMenuItem asChild>
<Link to={`/orders/${order.id}`}>
<Eye className="h-4 w-4 mr-2" />
Ver Detalhes
</Link>
</DropdownMenuItem>
<DropdownMenuItem>
<Edit className="h-4 w-4 mr-2" />
Editar
</DropdownMenuItem>
              {order.finalVideoUrl && (
                <DropdownMenuItem>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Vídeo Final
                </DropdownMenuItem>
              )}
              {canCancelOrder(order.status) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <CancelOrderButton
                      orderId={order.id}
                      createdAt={order.createdAt}
                      cancellationWindowHours={cancellationWindowHours}
                      variant="menu"
                      onSuccess={() => {}}
                    />
                  </DropdownMenuItem>
                </>
              )}
              {!canCancelOrder(order.status) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDeleteOrder(order.id)}
                    disabled={deleteOrderMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
</DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {order.briefing}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(order.deadline), "dd MMM", { locale: ptBR })}</span>
                    </div>
                    {order.editorId && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Editor atribuído</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/orders/${order.id}`}>
                      Ver mais
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum pedido encontrado</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece criando seu primeiro pedido de edição.'}
          </p>
          <Link to="/orders/new">
            <Button variant="premium">
              <Plus className="h-4 w-4" />
              Criar Primeiro Pedido
            </Button>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OrdersPage;
