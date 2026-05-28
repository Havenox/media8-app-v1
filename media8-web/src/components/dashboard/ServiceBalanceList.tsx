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
import { Package, Smartphone, Youtube, Video, AlertCircle, AlertTriangle, Calendar, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type ServiceListVariant = 'grid' | 'list';

const getExpirationInfo = (lot: UnifiedServiceBalance) => {
  const isSubscription = lot.ContractType === 'Assinatura';
  
  // 1. Fallback de data inteligente se ExpiresAt for nulo e for assinatura
  let expirationDate: Date | null = null;
  if (lot.ExpiresAt) {
    expirationDate = new Date(lot.ExpiresAt);
  } else if (isSubscription && lot.PurchaseDate) {
    const purchase = new Date(lot.PurchaseDate);
    expirationDate = new Date(purchase.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dias
  }

  if (!expirationDate) {
    return {
      text: 'Sem validade',
      daysRemaining: null,
      isUrgent: false,
      dateString: null
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expirationDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const dateString = format(expirationDate, 'dd/MM/yyyy');

  let text = '';
  let isUrgent = false;

  if (isSubscription) {
    if (daysRemaining < 0) {
      text = `Renovado em ${dateString}`;
    } else if (daysRemaining === 0) {
      text = 'Renova hoje!';
      isUrgent = true;
    } else if (daysRemaining === 1) {
      text = 'Renova amanhã!';
      isUrgent = true;
    } else {
      text = `Renova em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} (${dateString})`;
      if (daysRemaining <= 5) {
        isUrgent = true;
      }
    }
  } else {
    if (daysRemaining < 0) {
      text = `Expirado em ${dateString}`;
      isUrgent = true;
    } else if (daysRemaining === 0) {
      text = 'Expira hoje!';
      isUrgent = true;
    } else if (daysRemaining === 1) {
      text = 'Expira amanhã!';
      isUrgent = true;
    } else {
      text = `Válido até ${dateString} (restam ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'})`;
      if (daysRemaining <= 7) {
        isUrgent = true;
      }
    }
  }

  return {
    text,
    daysRemaining,
    isUrgent,
    dateString
  };
};

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
  const Icon = getIcon(lot.SnapshotVideoFormatName);
  const isSubscription = lot.ContractType === 'Assinatura';
  const expInfo = getExpirationInfo(lot);
  
  const percentConsumed = lot.TotalQuantity > 0 
    ? Math.round(((lot.TotalQuantity - lot.RemainingQuantity) / lot.TotalQuantity) * 100)
    : 0;

  return (
    <div className={cn(
      "relative rounded-lg p-4 border transition-all hover:bg-muted/50 border-l-4",
      isSubscription 
        ? "bg-[#F7FAFC] border-[#E2E8F0] border-l-blue-500" 
        : "bg-[#FFFCF5] border-[#E8E0D0] border-l-primary"
    )}>
      {/* Top Row: Title + Qty + Alert */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-md shrink-0 mt-0.5",
            isSubscription ? "bg-blue-100/60 text-blue-800" : "bg-amber-100/50 text-amber-800"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground leading-tight">
              {lot.SnapshotOfferName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">
                {lot.SnapshotVideoFormatName} ({lot.SnapshotMaxDurationSeconds}s)
              </p>
              {isSubscription && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1.5 py-0 h-4 shrink-0 font-medium hover:bg-blue-50">
                  Assinatura
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-center justify-end gap-1">
            <span className={cn("text-lg font-bold", isSubscription ? "text-blue-950" : "text-amber-950")}>
              {lot.RemainingQuantity}
            </span>
            <span className="text-xs text-muted-foreground">
              / {lot.TotalQuantity}
            </span>
          </div>
          {expInfo.isUrgent && (
            <div className="flex items-center justify-end gap-1 text-[10px] text-orange-600 font-semibold mt-0.5 animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              <span>Expira em breve</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar of Consumption */}
      <div className="w-full my-2">
        <div className="w-full h-1.5 bg-[#E8E0D0]/60 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isSubscription ? "bg-blue-600" : "bg-primary"
            )}
            style={{ width: `${percentConsumed}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] text-muted-foreground mt-1 px-0.5">
          <span>{percentConsumed}% de uso da cota</span>
          <span>{lot.RemainingQuantity} restantes</span>
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
            <div className={cn(
              "flex items-center gap-1",
              expInfo.isUrgent ? "text-orange-600 font-bold" : "text-blue-700"
            )}>
              <RefreshCw className={cn("h-3 w-3 shrink-0", expInfo.isUrgent && "animate-spin")} style={{ animationDuration: '3s' }} />
              <span>{expInfo.text}</span>
              <span className="text-[10px] font-normal opacity-85 ml-1 hidden sm:inline">(não-acumulativo)</span>
            </div>
          ) : (
            <div className={cn(
              "flex items-center gap-1",
              expInfo.isUrgent ? "text-orange-700 font-bold" : "text-amber-900/70"
            )}>
              <Clock className="h-3 w-3 shrink-0" />
              <span>{expInfo.text}</span>
            </div>
          )}
        </div>
      </div>

      {canConsume && (
        <div className="mt-3">
          <Button
            size="sm"
            className={cn(
              "w-full h-7 text-xs",
              isSubscription 
                ? "bg-blue-700 hover:bg-blue-800 text-white" 
                : "bg-amber-900/90 hover:bg-amber-900"
            )}
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
  const Icon = getIcon(lot.SnapshotVideoFormatName);
  const isSubscription = lot.ContractType === 'Assinatura';
  const expInfo = getExpirationInfo(lot);

  const percentConsumed = lot.TotalQuantity > 0 
    ? Math.round(((lot.TotalQuantity - lot.RemainingQuantity) / lot.TotalQuantity) * 100)
    : 0;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-lg border-l-4",
      isSubscription 
        ? "border-l-blue-500 bg-[#F7FAFC]/80" 
        : expInfo.isUrgent 
          ? "border-l-yellow-500" 
          : "border-l-primary"
    )}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-full",
            isSubscription ? "bg-blue-100 text-blue-700" : "bg-primary/10 text-primary"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 max-w-[150px] sm:max-w-[200px]">
              <CardTitle className="text-base font-bold text-foreground line-clamp-1" title={lot.SnapshotOfferName}>
                {lot.SnapshotOfferName}
              </CardTitle>
              {isSubscription && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1.5 py-0 h-4 shrink-0 font-medium hover:bg-blue-50">
                  Assinatura
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lot.SnapshotVideoFormatName} ({lot.SnapshotMaxDurationSeconds}s)
            </p>
          </div>
        </div>
        {expInfo.isUrgent && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100 animate-pulse text-[10px]">
            {isSubscription ? 'Renova' : 'Expira'}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {/* Visual Progress Bar of Consumption */}
        <div className="w-full mt-1 mb-3">
          <div className="w-full h-1.5 bg-[#E8E0D0]/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isSubscription ? "bg-blue-600" : "bg-primary"
              )}
              style={{ width: `${percentConsumed}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] text-muted-foreground mt-1 px-0.5">
            <span>{percentConsumed}% consumido</span>
            <span>{lot.TotalQuantity - lot.RemainingQuantity} de {lot.TotalQuantity} vídeos</span>
          </div>
        </div>

        <div className="flex justify-between items-end mt-4">
          <div>
            <span className={cn("text-3xl font-extrabold", isSubscription ? "text-blue-950" : "text-primary")}>
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
              className={cn(
                isSubscription && "bg-blue-700 hover:bg-blue-800 text-white"
              )}
            >
              Usar Crédito
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground border-t pt-3">
          {isSubscription ? (
            <div className={cn(
              "flex items-start gap-2",
              expInfo.isUrgent ? "text-orange-600 font-bold" : "text-blue-700 font-medium"
            )}>
              <RefreshCw className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", expInfo.isUrgent && "animate-spin")} style={{ animationDuration: '4s' }} />
              <div className="flex flex-col">
                <span>{expInfo.text}</span>
                <span className="text-[10px] font-normal opacity-75 mt-0.5 leading-none">
                  (Saldo não acumulativo • Perde se não usar)
                </span>
              </div>
            </div>
          ) : (
            <div className={cn(
              "flex items-center gap-2",
              expInfo.isUrgent ? "text-orange-600 font-bold" : "text-amber-900/70"
            )}>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{expInfo.text}</span>
            </div>
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
