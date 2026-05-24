import React from 'react';
import { useServiceBalances } from '@/hooks/useServiceBalances';
import { UnifiedServiceBalance } from '@/types/services';
import { ClientContract } from '@/types/offers';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, Smartphone, Youtube, Video, AlertCircle, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

type ServiceListVariant = 'grid' | 'list';

interface ServiceBalanceListProps {
  clientId?: string; // Optional: If provided, shows for specific client (Admin mode)
  canConsume?: boolean; // If true, shows "Consume" button (for Client Dashboard)
  onConsume?: (lot: UnifiedServiceBalance) => void;
  className?: string;
  variant?: ServiceListVariant; // Mode: 'grid' (default) or 'list' (stacked)
}

export const ServiceBalanceList: React.FC<ServiceBalanceListProps> = ({
  clientId,
  canConsume = false,
  onConsume,
  className,
  variant = 'grid'
}) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useServiceBalances({
    clientId,
    status: 'active',
    pageSize: 10
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
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

  const containerClasses = variant === 'list' 
    ? cn("flex flex-col gap-3", className)
    : cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className);

  return (
    <InfiniteScroll
      next={fetchNextPage}
      hasMore={!!hasNextPage}
      isLoading={isFetchingNextPage}
      className={containerClasses}
    >
      {lots.map((lot) => (
        variant === 'list' ? (
          <ServiceListItem
            key={lot.id}
            lot={lot}
            canConsume={canConsume}
            onConsume={onConsume}
          />
        ) : (
          <ServiceCard 
            key={lot.id} 
            lot={lot} 
            canConsume={canConsume} 
            onConsume={onConsume} 
          />
        )
      ))}
    </InfiniteScroll>
  );
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

const getIcon = (name: string) => {
  if (name.toLowerCase().includes('reels')) return Smartphone;
  if (name.toLowerCase().includes('youtube')) return Youtube;
  if (name.toLowerCase().includes('pacote')) return Package;
  return Video;
};


// 1. LIST VIEW (New Minimalist Design)
const ServiceListItem = ({
  lot,
  canConsume,
  onConsume
}: {
  lot: UnifiedServiceBalance;
  canConsume: boolean;
  onConsume?: (lot: UnifiedServiceBalance) => void;
}) => {
  const isExpiringSoon = lot.ExpiresAt &&
    new Date(lot.ExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const Icon = getIcon(lot.SnapshotVideoFormatName);

  // Formatar duração em segundos para exibição
  const formatDuration = (seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}min${secs}s` : `${mins}min`;
    }
    return `${seconds}s`;
  };

  // Lógica condicional baseada no tipo de contrato
  const isSubscription = lot.ContractType === 'Assinatura';
  
  return (
    <div className={cn(
      "relative rounded-lg p-4 border transition-all hover:bg-muted/50",
      // Visual styling: Soft yellow/beige background for cards
      "bg-[#FFFCF5] border-[#E8E0D0]"
    )}>
      {/* Top Row: Title + Qty + Alert */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100/50 rounded-md text-amber-800 shrink-0 mt-0.5">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground leading-tight">
              {lot.SnapshotOfferName}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lot.SnapshotVideoFormatName} ({lot.SnapshotMaxDurationSeconds}s)
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-center justify-end gap-1">
            <span className="text-lg font-bold text-amber-950">
              {lot.RemainingQuantity}
            </span>
            <span className="text-xs text-muted-foreground">
              / {lot.TotalQuantity}
            </span>
          </div>
          {isExpiringSoon && (
            <div className="flex items-center justify-end gap-1 text-[10px] text-orange-600 font-medium mt-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Expira em breve</span>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-2 bg-amber-200/30" />

      {/* Bottom Row: Conditional Footer based on ContractType */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 opacity-80">
          <Calendar className="h-3 w-3" />
          <span>Ativado: {lot.PurchaseDate ? format(new Date(lot.PurchaseDate), 'dd/MM/yy') : '-'}</span>
        </div>

        <div className="font-medium">
          {isSubscription ? (
            // ASSINATURA: Renova em [Data] (Créditos não acumulativos)
            <div className="flex items-center gap-1 text-blue-700">
              <AlertCircle className="h-3 w-3" />
              <span>
                Renova em{' '}
                {lot.ExpiresAt
                  ? format(new Date(lot.ExpiresAt), 'dd/MM/yyyy')
                  : 'data indefinida'}{' '}
                (Créditos não acumulativos)
              </span>
            </div>
          ) : (
            // PACOTE: Válido até [Data]
            <span className={cn(isExpiringSoon ? "text-orange-700" : "text-amber-900/70")}>
              Válido até{' '}
              {lot.ExpiresAt
                ? format(new Date(lot.ExpiresAt), 'dd/MM/yyyy')
                : 'sem validade'}
            </span>
          )}
        </div>
      </div>

      {canConsume && (
        <div className="mt-3">
          <Button
            size="sm"
            className="w-full h-7 text-xs bg-amber-900/90 hover:bg-amber-900"
            onClick={() => onConsume?.(lot)}
            disabled={lot.RemainingQuantity <= 0}
          >
            Usar Crédito
          </Button>
        </div>
      )}
    </div>
  );
};


// 2. GRID CARD VIEW (New Design with Snapshot)
const ServiceCard = ({
  lot,
  canConsume,
  onConsume
}: {
  lot: UnifiedServiceBalance;
  canConsume: boolean;
  onConsume?: (lot: UnifiedServiceBalance) => void;
}) => {
  const isExpiringSoon = lot.ExpiresAt &&
    new Date(lot.ExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const Icon = getIcon(lot.SnapshotVideoFormatName);
  const isSubscription = lot.ContractType === 'Assinatura';

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-lg border-l-4",
      isSubscription 
        ? "border-l-blue-500" 
        : isExpiringSoon 
          ? "border-l-yellow-500" 
          : "border-l-primary"
    )}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground line-clamp-1" title={lot.SnapshotOfferName}>
              {lot.SnapshotOfferName}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {lot.SnapshotVideoFormatName} ({lot.SnapshotMaxDurationSeconds}s)
            </p>
          </div>
        </div>
        {!isSubscription && isExpiringSoon && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Expira
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end mt-2">
          <div>
            <span className="text-3xl font-extrabold text-primary">
              {lot.RemainingQuantity}
            </span>
            <span className="text-sm text-muted-foreground ml-1">
              / {lot.TotalQuantity} créditos
            </span>
          </div>

          {canConsume && (
            <Button
              size="sm"
              onClick={() => onConsume?.(lot)}
              disabled={lot.RemainingQuantity <= 0}
            >
              Usar Crédito
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          {isSubscription ? (
            <>
              <AlertCircle className="h-3 w-3 text-blue-600" />
              <span className="text-blue-700">
                Renova em {lot.ExpiresAt ? format(new Date(lot.ExpiresAt), 'dd/MM/yyyy') : 'data indefinida'} (Créditos não acumulativos)
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              <span>
                {lot.ExpiresAt
                  ? `Válido até ${format(new Date(lot.ExpiresAt), 'dd/MM/yyyy')}`
                  : 'Sem validade'}
              </span>
            </>
          )}
        </div>
      </CardContent>

      {/* Background decoration */}
      <div className="absolute -right-4 -bottom-4 opacity-5">
        <Icon className="h-24 w-24 transform -rotate-12" />
      </div>
    </Card>
  );
};
