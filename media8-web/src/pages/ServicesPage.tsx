import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Sparkles,
  Package,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllServiceBalances } from '@/hooks/useServiceBalances';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceBalanceCard } from '@/components/dashboard/ServiceBalanceCard';
import { ServiceBalanceAggregated, ServiceCategory } from '@/types/services';

type StatusFilter = 'all' | 'active' | 'expired' | 'zeroed';
type SortOption = 'urgency' | 'recent' | 'alphabetical';

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const { data: services, isLoading, error } = useAllServiceBalances(user?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('urgency');

  // Filter and sort services
  const filteredServices = useMemo(() => {
    if (!services) return [];

    let result = [...services];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.planName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((s) => {
        switch (statusFilter) {
          case 'active':
            return !s.isExpired && s.totalQuantity > 0;
          case 'expired':
            return s.isExpired;
          case 'zeroed':
            return s.isZeroed && !s.isExpired;
          default:
            return true;
        }
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((s) => s.category === categoryFilter);
    }

    // Sort
    switch (sortOption) {
      case 'urgency':
        // Prioridade em camadas: 1) Ativos com cota > 2) Ativos zerados > 3) Expirados
        result.sort((a, b) => {
          // 1. Ativos com cota disponível SEMPRE vêm primeiro
          const aHasQuota = a.totalQuantity > 0 && !a.isExpired;
          const bHasQuota = b.totalQuantity > 0 && !b.isExpired;
          
          if (aHasQuota && !bHasQuota) return -1;
          if (!aHasQuota && bHasQuota) return 1;
          
          // 2. Se ambos não têm cota, verificar se são ativos (zerados) ou expirados
          if (!aHasQuota && !bHasQuota) {
            const aIsActive = !a.isExpired;
            const bIsActive = !b.isExpired;
            
            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;
          }
          
          // 3. Dentro do mesmo grupo, ordenar por urgência
          const daysA = a.daysUntilRenewal ?? a.daysUntilExpiry ?? Infinity;
          const daysB = b.daysUntilRenewal ?? b.daysUntilExpiry ?? Infinity;
          return daysA - daysB;
        });
        break;
      case 'recent':
        // Sort by lots with most recent purchase first
        result.sort((a, b) => {
          const dateA = a.lots[0]?.purchasedAt || '';
          const dateB = b.lots[0]?.purchasedAt || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        break;
      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [services, searchQuery, statusFilter, categoryFilter, sortOption]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 flex-wrap">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">
            Erro ao carregar seus serviços. Tente novamente mais tarde.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">Seus Serviços</h1>
        <p className="text-muted-foreground">
          Histórico completo de pacotes e assinaturas
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 flex-wrap"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="zeroed">Esgotados</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as ServiceCategory | 'all')}
        >
          <SelectTrigger className="w-40">
            <Package className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="reels">Reels</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="pacote">Pacotes</SelectItem>
            <SelectItem value="avulso">Avulsos</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={sortOption}
          onValueChange={(v) => setSortOption(v as SortOption)}
        >
          <SelectTrigger className="w-44">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgency">Mais Urgente</SelectItem>
            <SelectItem value="recent">Mais Recente</SelectItem>
            <SelectItem value="alphabetical">Alfabético</SelectItem>
          </SelectContent>
        </Select>

        {/* Contract More Button */}
        <Link to="/" className="ml-auto">
          <Button variant="premium">
            <Sparkles className="h-4 w-4" />
            Contratar Mais
          </Button>
        </Link>
      </motion.div>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch"
        >
          {filteredServices.map((balance, index) => (
            <motion.div key={`${balance.serviceType}-${balance.planName}`} variants={itemVariants}>
              <ServiceBalanceCard balance={balance} index={index} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum serviço encontrado
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Você ainda não possui serviços contratados.'}
          </p>
          <Link to="/">
            <Button variant="premium">
              <Sparkles className="h-4 w-4" />
              Ver Planos e Pacotes
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Results count */}
      {filteredServices.length > 0 && (
        <motion.p
          variants={itemVariants}
          className="text-sm text-muted-foreground text-center"
        >
          Exibindo {filteredServices.length}{' '}
          {filteredServices.length === 1 ? 'serviço' : 'serviços'}
          {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') &&
            ` de ${services?.length || 0} total`}
        </motion.p>
      )}
    </motion.div>
  );
};

export default ServicesPage;
