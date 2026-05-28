import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { 
  Package, 
  Smartphone, 
  Youtube, 
  Video, 
  AlertCircle, 
  AlertTriangle, 
  Calendar, 
  RefreshCw, 
  Clock,
  MoreHorizontal,
  Plus,
  ShoppingCart
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    
    if (isExpiredA && !isExpiredB) return 1; // a expirou, b não. b vem antes
    if (!isExpiredA && isExpiredB) return -1; // b expirou, a não. a vem antes
    
    return daysA - daysB; // menor quantidade de dias (mais próximo do vencimento) vem primeiro
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

// ==========================================
// SUB-COMPONENTS
// ==========================================

const getIcon = (name: string) => {
  if (name.toLowerCase().includes('reels')) return Smartphone;
  if (name.toLowerCase().includes('youtube')) return Youtube;
  if (name.toLowerCase().includes('pacote')) return Package;
  return Video;
};

const renderContractTypeBadge = (contractType: string) => {
  if (!contractType || contractType === 'Desconhecido') return null;
  
  const styles: Record<string, string> = {
    Assinatura: "bg-[#7B0A0A]/10 text-[#7B0A0A] border-[#7B0A0A]/20 hover:bg-[#7B0A0A]/10",
    Pacote: "bg-[#400404]/10 text-[#400404] border-[#400404]/20 hover:bg-[#400404]/10",
    Avulso: "bg-amber-600/10 text-amber-800 border-amber-600/20 hover:bg-amber-600/10"
  };
  
  const style = styles[contractType] || "bg-[#400404]/10 text-[#400404] border-[#400404]/20 hover:bg-[#400404]/10";
  
  return (
    <Badge variant="secondary" className={cn("text-[9px] px-1.5 py-0.5 h-4 font-semibold border rounded-sm", style)}>
      {contractType}
    </Badge>
  );
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
      "relative rounded-lg p-3 border transition-all hover:bg-muted/50 border-l-4",
      isSubscription 
        ? "bg-[#FFFBED] border-[#E8E0D0] border-l-[#7B0A0A]" 
        : expInfo.isUrgent
          ? "bg-[#FFFBED] border-[#E8E0D0] border-l-amber-600"
          : "bg-[#FFFBED] border-[#E8E0D0] border-l-[#400404]"
    )}>
      {/* Main Flex Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Left Section: Icon, Title, Format */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1.5 rounded-md text-white shrink-0",
            isSubscription ? "bg-[#7B0A0A]" : expInfo.isUrgent ? "bg-amber-600" : "bg-[#400404]"
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-[#400404] leading-none">
                {lot.SnapshotOfferName}
              </h4>
              {renderContractTypeBadge(lot.ContractType)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lot.SnapshotVideoFormatName} ({lot.SnapshotMaxDurationSeconds}s)
            </p>
          </div>
        </div>

        {/* Right Section: Credits & Usage */}
        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-base font-extrabold text-[#400404]">
              {lot.RemainingQuantity}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              / {lot.TotalQuantity} créditos
            </span>
          </div>

          {canConsume && (
            <Button
              size="sm"
              className={cn(
                "h-7 px-3 text-xs font-semibold text-[#FFFBED]",
                isSubscription 
                  ? "bg-[#7B0A0A] hover:bg-[#5C1212]" 
                  : "bg-[#400404] hover:bg-[#5C1212]"
              )}
              onClick={() => onConsume?.(lot)}
              disabled={lot.RemainingQuantity <= 0}
            >
              Usar
            </Button>
          )}
        </div>
      </div>

      {/* Thin elegant Progress Bar */}
      <div className="w-full mt-2.5">
        <div className="w-full h-1 bg-[#E8E0D0]/50 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isSubscription ? "bg-[#7B0A0A]" : expInfo.isUrgent ? "bg-amber-600" : "bg-[#400404]"
            )}
            style={{ width: `${percentConsumed}%` }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-dashed border-[#E8E0D0]">
        <div className="flex items-center gap-1 opacity-80">
          <Calendar className="h-3 w-3" />
          <span>Ativado: {lot.PurchaseDate ? format(new Date(lot.PurchaseDate), 'dd/MM/yy') : '-'}</span>
        </div>

        <div className="font-medium">
          {isSubscription ? (
            <div className={cn(
              "flex items-center gap-1",
              expInfo.isUrgent ? "text-orange-600 font-bold" : "text-[#7B0A0A]"
            )}>
              <RefreshCw className={cn("h-3 w-3 shrink-0", expInfo.isUrgent && "animate-spin")} style={{ animationDuration: '3s' }} />
              <span>{expInfo.text}</span>
              <span className="text-[9px] font-normal opacity-85 ml-1 hidden sm:inline">(não-acumulativo)</span>
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
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const Icon = getIcon(lot.SnapshotVideoFormatName);
  const isSubscription = lot.ContractType === 'Assinatura';
  const expInfo = getExpirationInfo(lot);

  const percentConsumed = lot.TotalQuantity > 0 
    ? Math.round(((lot.TotalQuantity - lot.RemainingQuantity) / lot.TotalQuantity) * 100)
    : 0;

  const cardContent = (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-md border-l-4 p-5 flex flex-col justify-between bg-[#FFFBED] border-[#E8E0D0] w-full min-h-[180px] select-none",
      isSubscription 
        ? "border-l-[#7B0A0A]" 
        : expInfo.isUrgent 
          ? "border-l-amber-600" 
          : "border-l-[#400404]",
      !canConsume && "cursor-pointer",
      !canConsume && (isHovered || menuOpen) && "shadow-lg ring-1 ring-primary/20 bg-[#FFFDF6]"
    )}>
      {/* Top Section: Title & Credits Row */}
      <div className="flex justify-between items-start gap-2 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-1.5 rounded-full text-[#FFFBED]",
            isSubscription ? "bg-[#7B0A0A]" : expInfo.isUrgent ? "bg-amber-600" : "bg-[#400404]"
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap max-w-[170px] sm:max-w-[200px]">
              <CardTitle className="text-base font-bold text-[#400404] line-clamp-1 leading-none" title={lot.SnapshotOfferName}>
                {lot.SnapshotOfferName}
              </CardTitle>
              {renderContractTypeBadge(lot.ContractType)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lot.SnapshotVideoFormatName} ({lot.SnapshotMaxDurationSeconds}s)
            </p>
          </div>
        </div>

        {/* Credits */}
        <div className="text-right shrink-0">
          <span className="text-lg font-extrabold text-[#400404]">
            {lot.RemainingQuantity}
          </span>
          <span className="text-[11px] text-muted-foreground ml-0.5">
            /{lot.TotalQuantity}
          </span>
          <p className="text-[10px] text-muted-foreground leading-none">créditos</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full my-3">
        <div className="w-full h-1 bg-[#E8E0D0]/50 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isSubscription ? "bg-[#7B0A0A]" : expInfo.isUrgent ? "bg-amber-600" : "bg-[#400404]"
            )}
            style={{ width: `${percentConsumed}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
          <span>{percentConsumed}% consumido</span>
          <span>{lot.RemainingQuantity} restantes</span>
        </div>
      </div>

      {/* Footer & Action Row */}
      <div className="flex items-center justify-between gap-2 mt-3.5 pt-3.5 border-t border-dashed border-[#E8E0D0] text-[11px]">
        {/* Renewal / Expiry */}
        <div className="flex-1 min-w-0">
          {isSubscription ? (
            <div className={cn(
              "flex items-center gap-1 min-w-0",
              expInfo.isUrgent ? "text-orange-600 font-bold" : "text-[#7B0A0A] font-medium"
            )}>
              <RefreshCw className={cn("h-3 w-3 shrink-0", expInfo.isUrgent && "animate-spin")} style={{ animationDuration: '4s' }} />
              <span className="truncate" title={expInfo.text}>{expInfo.text}</span>
            </div>
          ) : (
            <div className={cn(
              "flex items-center gap-1 min-w-0",
              expInfo.isUrgent ? "text-orange-600 font-bold" : "text-amber-900/70"
            )}>
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate" title={expInfo.text}>{expInfo.text}</span>
            </div>
          )}
        </div>

        {/* Consume Button */}
        {canConsume && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onConsume?.(lot);
            }}
            disabled={lot.RemainingQuantity <= 0}
            className={cn(
              "h-7 px-3 text-[11px] font-bold text-[#FFFBED] shrink-0",
              isSubscription ? "bg-[#7B0A0A] hover:bg-[#5C1212]" : "bg-[#400404] hover:bg-[#5C1212]"
            )}
          >
            Usar
          </Button>
        )}
      </div>

      {/* Background decoration */}
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <Icon className="h-16 w-16 transform -rotate-12" />
      </div>

      {/* Ellipsis indicator - appears on hover when not in consume mode */}
      {!canConsume && (
        <div className={cn(
          "absolute bottom-3 right-3 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 transition-opacity duration-200",
          (isHovered || menuOpen) ? "opacity-100" : "opacity-0"
        )}>
          <MoreHorizontal className="h-3.5 w-3.5 text-[#400404]" />
        </div>
      )}
    </Card>
  );

  if (canConsume) {
    return cardContent;
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full w-full lg:max-w-[400px] max-w-none relative"
    >
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          {cardContent}
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-[#FFFBED] border-[#E8E0D0] shadow-xl z-50"
        >
          <DropdownMenuItem 
            onClick={() => navigate(`/orders/new?lotId=${lot.Id}`)}
            className="flex items-center gap-2 cursor-pointer text-[#400404] hover:bg-[#E8E0D0]/30 focus:bg-[#E8E0D0]/30 font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>+ Novo Pedido</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer text-[#400404] hover:bg-[#E8E0D0]/30 focus:bg-[#E8E0D0]/30"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Contratar mais</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
