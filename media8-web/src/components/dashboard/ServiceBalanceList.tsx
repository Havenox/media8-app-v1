import React from 'react';
import { useServiceBalances } from '@/hooks/useServiceBalances';
import { UnifiedServiceBalance } from '@/types/services';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Package, Smartphone, Youtube, Video, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceBalanceListProps {
  clientId?: string; // Optional: If provided, shows for specific client (Admin mode)
  canConsume?: boolean; // If true, shows "Consume" button (for Client Dashboard)
  onConsume?: (lot: UnifiedServiceBalance) => void;
  className?: string;
}

export const ServiceBalanceList: React.FC<ServiceBalanceListProps> = ({
  clientId,
  canConsume = false,
  onConsume,
  className
}) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useServiceBalances({
    clientId,
    status: 'active',
    pageSize: 10
  });

  const lots = data?.pages.flatMap(page => page.data) || [];

  if (isLoading) {
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
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
        <Package className="mx-auto h-12 w-12 opacity-50 mb-2" />
        <p>Nenhum serviço ativo encontrado.</p>
      </div>
    );
  }

  return (
    <InfiniteScroll
      next={fetchNextPage}
      hasMore={!!hasNextPage}
      isLoading={isFetchingNextPage}
      className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}
    >
      {lots.map((lot) => (
        <ServiceCard 
          key={lot.id} 
          lot={lot} 
          canConsume={canConsume} 
          onConsume={onConsume} 
        />
      ))}
    </InfiniteScroll>
  );
};

// Sub-component for individual card
const ServiceCard = ({ 
  lot, 
  canConsume, 
  onConsume 
}: { 
  lot: UnifiedServiceBalance; 
  canConsume: boolean;
  onConsume?: (lot: UnifiedServiceBalance) => void;
}) => {
  const isExpiringSoon = lot.expiresAt && 
    new Date(lot.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const getIcon = (name: string) => {
    if (name.toLowerCase().includes('reels')) return Smartphone;
    if (name.toLowerCase().includes('youtube')) return Youtube;
    if (name.toLowerCase().includes('pacote')) return Package;
    return Video;
  };

  const Icon = getIcon(lot.serviceName);

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-lg border-l-4",
      isExpiringSoon ? "border-l-yellow-500" : "border-l-primary"
    )}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              {lot.packageName}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{lot.serviceName}</p>
          </div>
        </div>
        {isExpiringSoon && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Expira em breve
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end mt-2">
          <div>
            <span className="text-3xl font-extrabold text-primary">
              {lot.remainingQuantity}
            </span>
            <span className="text-sm text-muted-foreground ml-1">
              / {lot.totalQuantity} créditos
            </span>
          </div>
          
          {canConsume && (
            <Button 
              size="sm" 
              onClick={() => onConsume?.(lot)}
              disabled={lot.remainingQuantity <= 0}
            >
              Usar Crédito
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>
            {lot.expiresAt 
              ? `Válido até ${format(new Date(lot.expiresAt), 'dd/MM/yyyy')}`
              : 'Sem validade (Assinatura)'}
          </span>
        </div>
      </CardContent>
      
      {/* Background decoration */}
      <div className="absolute -right-4 -bottom-4 opacity-5">
        <Icon className="h-24 w-24 transform -rotate-12" />
      </div>
    </Card>
  );
};
