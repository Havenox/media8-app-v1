import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Scissors,
  Clock,
  Play,
  CheckCircle2,
  MessageSquare,
  Upload,
  Eye,
  Calendar,
  User,
  Filter,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrderStatus } from '@/types/api';

// Hooks
import { useOrders, useOrdersByEditor, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useUsers } from '@/hooks/useUsers';

const EditsPage: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // For editors, show orders assigned to them; for admin, show all
  const isEditor = user?.Role === 'Editor';
  const { data: allOrders = [], isLoading: isLoadingAll } = useOrders();
  const { data: editorOrders = [], isLoading: isLoadingEditor } = useOrdersByEditor(isEditor ? user?.id : undefined);
  const { data: users = [] } = useUsers();
  
  const orders = isEditor ? editorOrders : allOrders;
  const isLoading = isEditor ? isLoadingEditor : isLoadingAll;

  const updateStatusMutation = useUpdateOrderStatus();

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter === 'all') return true;
      return order.status === statusFilter;
    });
  }, [orders, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    pending: orders.filter((o) => o.status === 'Pending').length,
    inProgress: orders.filter((o) => o.status === 'InProgress').length,
    inReview: orders.filter((o) => o.status === 'InReview').length,
    completed: orders.filter((o) => o.status === 'Approved').length,
  }), [orders]);

  // Get client name by ID
  const getClientName = (clientId: string) => {
    const client = users.find(u => u.id === clientId);
    return client?.name || `Cliente #${clientId}`;
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
    } catch (error) {
      // Error handled in hook
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Minhas Edições
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os vídeos atribuídos a você.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-info/20 bg-info/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Eye className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inReview}</p>
                <p className="text-sm text-muted-foreground">Em Revisão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pending">Pendente</SelectItem>
            <SelectItem value="InProgress">Em Progresso</SelectItem>
            <SelectItem value="InReview">Em Revisão</SelectItem>
            <SelectItem value="ChangesRequested">Alterações Solicitadas</SelectItem>
            <SelectItem value="Approved">Aprovado</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Orders List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Vídeos para Editar
            </CardTitle>
            <CardDescription>
              Lista de vídeos atribuídos a você
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Scissors className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{order.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Cliente: {getClientName(order.clientId)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Prazo: {format(new Date(order.deadline), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={updateStatusMutation.isPending}>
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Ações'
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'InProgress')}>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Edição
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'InReview')}>
                          <Eye className="h-4 w-4 mr-2" />
                          Enviar para Revisão
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'Approved')}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Marcar Aprovado
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Versão
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ver Comentários
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-8">
                  <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">Nenhum vídeo encontrado</h3>
                  <p className="text-muted-foreground text-sm">
                    Não há vídeos atribuídos a você com este status.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default EditsPage;
