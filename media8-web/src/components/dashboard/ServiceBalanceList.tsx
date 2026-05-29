import React from 'react';
import { useServiceBalances } from '@/hooks/useServiceBalances';
import { UnifiedServiceBalance } from '@/types/services';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceCard, ServiceListItem } from '@/components/dashboard/ServiceCard';

type ServiceListVariant = 'grid' | 'list';

interface ServiceBalanceListProps {
  clientId?: string; // Optional: If provided, shows for specific client (Admin mode)
  canConsume?: boolean; // If true, shows "Consume" button (for Client Dashboard)
  onConsume?: (lot: UnifiedServiceBalance) => void;
  className?: string;
  variant?: ServiceListVariant; // Mode: 'grid' (default) or 'list' (stacked)
  limit?: number;
  status?: string;
}

export const ServiceBalanceList: React.FC<ServiceBalanceListProps> = ({
  clientId,
  canConsume = false,
  onConsume,
  className,
  variant = 'grid',
  limit,
  status
}) => {
  const isDashboardGrid = variant === 'grid' && !clientId;
  const queryStatus = status || (isDashboardGrid ? 'dashboard' : 'active');
  const queryPageSize = limit || 10;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useServiceBalances({
    clientId,
    status: queryStatus,
    pageSize: queryPageSize
  });

  const lots = data?.pages.flatMap(page => page.data) || [];

  if (isLoading) {
    if (variant === 'list') {
      return (
        <div className="flex flex-col gap-4">
           {[1, 2, 3].map((i) => (
             <Skeleton key={i} className="h-24 w-full rounded-lg" />
           ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 w-full">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[180px] w-full lg:max-w-[400px] max-w-none rounded-xl" />
        ))}
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className={cn(
        "text-center text-muted-foreground border-2 border-dashed rounded-xl",
        variant === 'list' ? "py-6" : "py-10"
      )}>
        <Package className="mx-auto h-8 w-8 opacity-50 mb-2" />
        <p className="text-sm">Nenhum serviço ativo encontrado.</p>
      </div>
    );
  }

  // Helper para obter dias restantes de validade para ordenação
  const getDaysRemainingForSort = (lot: UnifiedServiceBalance) => {
    const isSubscription = lot.ContractType === 'Assinatura';
    let expirationDate: Date | null = null;
    if (lot.ExpiresAt) {
      expirationDate = new Date(lot.ExpiresAt);
    } else if (isSubscription && lot.PurchaseDate) {
      const purchase = new Date(lot.PurchaseDate);
      expirationDate = new Date(purchase.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    if (!expirationDate) return Infinity; // Sem validade vai para o final
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(expirationDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Ordenação: Ativos (não vencidos/expirados) com menor prazo à frente, seguidos de expirados e sem validade por último
  const sortedLots = [...lots].sort((a, b) => {
    const daysA = getDaysRemainingForSort(a);
    const daysB = getDaysRemainingForSort(b);
    
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

  const containerClasses = variant === 'list' 
    ? cn("flex flex-col gap-3", className)
    : cn("grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 w-full", className);

  const renderedLots = sortedLots.map((lot) => (
    variant === 'list' ? (
      <ServiceListItem
        key={lot.Id}
        lot={lot}
        canConsume={canConsume}
        onConsume={onConsume}
      />
    ) : (
      <ServiceCard 
        key={lot.Id} 
        lot={lot} 
        canConsume={canConsume} 
        onConsume={onConsume} 
      />
    )
  ));

  if (limit) {
    return (
      <div className={containerClasses}>
        {renderedLots}
      </div>
    );
  }

  return (
    <InfiniteScroll
      next={fetchNextPage}
      hasMore={!!hasNextPage}
      isLoading={isFetchingNextPage}
      className={containerClasses}
    >
      {renderedLots}
    </InfiniteScroll>
  );
};
