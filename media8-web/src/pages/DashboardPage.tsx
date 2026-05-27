import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  Video,
  Plus,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceInventory } from '@/components/dashboard/ServiceInventory';

// Hooks
import { useOrders, useOrdersByClient, useOrdersByEditor } from '@/hooks/useOrders';
import { useQuery } from '@tanstack/react-query';
import { orderKeys } from '@/hooks/useOrders';
import { orderService } from '@/services/orderService';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
}) => {
  const variants = {
    default: 'border-border',
    primary: 'border-primary/20 bg-primary/5',
    success: 'border-success/20 bg-success/5',
    warning: 'border-warning/20 bg-warning/5',
  };

  const iconVariants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <Card variant="elevated" className={variants[variant]}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconVariants[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={`text-sm font-medium ${trend.positive ? 'text-success' : 'text-destructive'}`}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
          )}
          <span className="text-sm text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Loading skeleton for dashboards
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

// Dashboard for Client role
const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useOrdersByClient(user?.Id);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.Status === 'Pending').length,
    inProgress: orders.filter((o) => o.Status === 'InProgress').length,
    completed: orders.filter((o) => o.Status === 'Approved').length,
  }), [orders]);

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

  if (isLoading) {
    return <DashboardSkeleton />;
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
            Olá, {user?.Name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo dos seus projetos de edição.
          </p>
        </div>
        <Link to="/orders/new">
          <Button variant="premium" size="lg">
            <Plus className="h-5 w-5" />
            Novo Pedido
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Pedidos"
          value={stats.total}
          description="este mês"
          icon={FolderKanban}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Pendentes"
          value={stats.pending}
          description="aguardando editor"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgress}
          description="sendo editados"
          icon={Video}
          variant="primary"
        />
        <StatCard
          title="Concluídos"
          value={stats.completed}
          description="este mês"
          icon={CheckCircle2}
          trend={{ value: 8, positive: true }}
          variant="success"
        />
      </motion.div>

      {/* Service Inventory */}
      <motion.div variants={itemVariants}>
        <ServiceInventory />
      </motion.div>

      {/* Recent Orders */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>Seus últimos projetos de edição</CardDescription>
            </div>
            <Link to="/orders">
              <Button variant="ghost" size="sm">
                Ver Todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 4).map((order) => (
                <motion.div
                  key={order.Id}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{order.Title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Prazo: {format(new Date(order.Deadline), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={order.Status} />
                </motion.div>
              ))}
              {orders.length === 0 && (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">Nenhum pedido ainda</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Crie seu primeiro pedido de edição.
                  </p>
                  <Link to="/orders/new">
                    <Button variant="premium">
                      <Plus className="h-4 w-4" />
                      Novo Pedido
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// Dashboard for Editor role
const EditorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useOrdersByEditor(user?.Id);

  const stats = useMemo(() => ({
    pending: orders.filter((o) => o.Status === 'Pending').length,
    inProgress: orders.filter((o) => o.Status === 'InProgress').length,
    inReview: orders.filter((o) => o.Status === 'InReview').length,
    completed: orders.filter((o) => o.Status === 'Approved').length,
  }), [orders]);

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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {user?.Name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo das suas edições.
          </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pendentes"
          value={stats.pending}
          description="aguardando você"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgress}
          description="editando agora"
          icon={Video}
          variant="primary"
        />
        <StatCard
          title="Em Revisão"
          value={stats.inReview}
          description="aguardando cliente"
          icon={FolderKanban}
        />
        <StatCard
          title="Concluídos"
          value={stats.completed}
          description="este mês"
          icon={CheckCircle2}
          trend={{ value: 8, positive: true }}
          variant="success"
        />
      </motion.div>

      {/* Quick Link to Edits */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Suas Edições</CardTitle>
              <CardDescription>Vídeos atribuídos a você</CardDescription>
            </div>
            <Link to="/edits">
              <Button variant="premium">
                Ver Edições
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Acesse a página de edições para ver todos os vídeos atribuídos a você e gerenciar seus status.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// Dashboard for Admin role
const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Conditional query: only fetch all orders if user is admin
  const { data: orders = [], isLoading } = useQuery({
    queryKey: orderKeys.lists(),
    queryFn: () => orderService.getAll(),
    enabled: user?.Role === 'Admin', // ❌ NÃO executa se não for admin
  });

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.Status === 'Pending').length,
    inProgress: orders.filter((o) => o.Status === 'InProgress').length,
    completed: orders.filter((o) => o.Status === 'Approved').length,
  }), [orders]);

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

  if (isLoading) {
    return <DashboardSkeleton />;
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
            Olá, {user?.Name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da plataforma Media 8.
          </p>
        </div>
        <Link to="/orders/new">
          <Button variant="premium" size="lg">
            <Plus className="h-5 w-5" />
            Novo Pedido
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Pedidos"
          value={stats.total}
          description="este mês"
          icon={FolderKanban}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Pendentes"
          value={stats.pending}
          description="aguardando editor"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgress}
          description="sendo editados"
          icon={Video}
          variant="primary"
        />
        <StatCard
          title="Concluídos"
          value={stats.completed}
          description="este mês"
          icon={CheckCircle2}
          trend={{ value: 8, positive: true }}
          variant="success"
        />
      </motion.div>

      {/* Service Inventory (Admin can see all) */}
      <motion.div variants={itemVariants}>
        <ServiceInventory />
      </motion.div>

      {/* Recent Orders */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>Últimos projetos da plataforma</CardDescription>
            </div>
            <Link to="/orders">
              <Button variant="ghost" size="sm">
                Ver Todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 4).map((order) => (
                <motion.div
                  key={order.Id}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{order.Title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Prazo: {format(new Date(order.Deadline), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={order.Status} />
                </motion.div>
              ))}
              {orders.length === 0 && (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">Nenhum pedido ainda</h3>
                  <p className="text-muted-foreground text-sm">
                    Os pedidos aparecerão aqui.
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

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Render dashboard based on user role (PascalCase: user.Role)
  if (user?.Role === 'Editor') {
    return <EditorDashboard />;
  }

  if (user?.Role === 'Admin') {
    return <AdminDashboard />;
  }

  // Default: Client dashboard
  return <ClientDashboard />;
};

export default DashboardPage;
