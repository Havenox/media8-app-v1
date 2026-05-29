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
import { InfiniteScroll } from '@/components/ui/infinite-scroll';
import { useServiceBalances } from '@/hooks/useServiceBalances';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceCard } from '@/components/dashboard/ServiceCard';
import { UnifiedServiceBalance, ServiceCategory } from '@/types/services';

type StatusFilter = 'all' | 'active' | 'expired' | 'zeroed';
type SortOption = 'urgency' | 'recent' | 'alphabetical';

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  
  // Chamar 10 por vez com scroll infinito, no status 'all' para recuperar tudo do backend
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useServiceBalances({
    status: 'all',
    pageSize: 10,
    enabled: !!user?.Id
  });

  const services = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

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
      result = result.filter((s) => {
        return (
          s.SnapshotVideoFormatName.toLowerCase().includes(query) ||
          s.SnapshotOfferName.toLowerCase().includes(query) ||
          s.SnapshotEditingStyleName.toLowerCase().includes(query)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((s) => {
        const today = new Date();
        const isExpired = s.ExpiresAt ? new Date(s.ExpiresAt) < today : false;
        
        switch (statusFilter) {
          case 'active':
            return !isExpired && s.RemainingQuantity > 0;
          case 'expired':
            return isExpired;
          case 'zeroed':
            return s.RemainingQuantity === 0;
          default:
            return true;
        }
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((s) => {
        const formatLower = s.SnapshotVideoFormatName.toLowerCase();
        switch (categoryFilter) {
          case 'reels':
            return formatLower.includes('reels');
          case 'youtube':
            return formatLower.includes('youtube');
          case 'pacote':
            return s.ContractType === 'Pacote';
          case 'avulso':
            return s.ContractType === 'Avulso';
          default:
            return true;
        }
      });
    }

    // Sort
    const getDaysRemaining = (lot: UnifiedServiceBalance) => {
      const isSubscription = lot.ContractType === 'Assinatura';
      let expirationDate: Date | null = null;
      if (lot.ExpiresAt) {
        expirationDate = new Date(lot.ExpiresAt);
      } else if (isSubscription && lot.PurchaseDate) {
        const purchase = new Date(lot.PurchaseDate);
        expirationDate = new Date(purchase.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
      if (!expirationDate) return Infinity;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(expirationDate);
      target.setHours(0, 0, 0, 0);
      return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    switch (sortOption) {
      case 'urgency':
        result.sort((a, b) => {
          const daysA = getDaysRemaining(a);
          const daysB = getDaysRemaining(b);
          
          const isExpiredA = daysA < 0;
          const isExpiredB = daysB < 0;
          
          // 1. Ativos antes de expirados
          if (isExpiredA && !isExpiredB) return 1;
          if (!isExpiredA && isExpiredB) return -1;
          
          // 2. Se ambos forem expirados (dias negativos)
          // Expirados mais recentemente primeiro (Descendente)
          if (isExpiredA && isExpiredB) {
            return daysB - daysA;
          }
          
          // 3. Se ambos forem ativos (dias positivos ou Infinity)
          // Menor prazo primeiro (Ascendente)
          if (daysA === Infinity && daysB !== Infinity) return 1;
          if (daysA !== Infinity && daysB === Infinity) return -1;
          if (daysA === Infinity && daysB === Infinity) return 0;
          return daysA - daysB;
        });
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.PurchaseDate).getTime() - new Date(a.PurchaseDate).getTime());
        break;
      case 'alphabetical':
        result.sort((a, b) => a.SnapshotVideoFormatName.localeCompare(b.SnapshotVideoFormatName));
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

      {/* Services Grid with InfiniteScroll */}
      {filteredServices.length > 0 ? (
        <InfiniteScroll
          next={fetchNextPage}
          hasMore={!!hasNextPage}
          isLoading={isFetchingNextPage}
          className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 items-stretch w-full"
        >
          {filteredServices.map((lot, index) => (
            <motion.div key={lot.Id} variants={itemVariants} className="h-full">
              <ServiceCard lot={lot} canConsume={false} />
            </motion.div>
          ))}
        </InfiniteScroll>
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
