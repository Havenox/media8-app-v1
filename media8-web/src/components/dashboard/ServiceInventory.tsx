import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useServiceBalances } from '@/hooks/useServiceBalances';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceBalanceCard } from './ServiceBalanceCard';

const MAX_CARDS_HOME = 6;

export const ServiceInventory: React.FC = () => {
  const { user } = useAuth();
  const { data: balances, isLoading, error } = useServiceBalances(user?.id);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
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

  // Services already sorted by urgency from the service layer
  const activeServices = balances || [];
  const hasServices = activeServices.length > 0;
  const displayServices = activeServices.slice(0, MAX_CARDS_HOME);
  const hasMore = activeServices.length > MAX_CARDS_HOME;
  const hiddenCount = activeServices.length - MAX_CARDS_HOME;

  // Empty state
  if (!hasServices) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum serviço disponível
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Você ainda não possui créditos de edição. Adquira um pacote ou assinatura para começar.
          </p>
          <Link to="/">
            <Button variant="premium">
              <Sparkles className="h-4 w-4" />
              Ver Planos e Pacotes
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Seus Serviços Disponíveis
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecione um serviço ao criar um novo pedido
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/services">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Ver Todos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ShoppingBag className="h-4 w-4" />
              Contratar Mais
            </Button>
          </Link>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {displayServices.map((balance, index) => (
          <ServiceBalanceCard 
            key={`${balance.serviceType}-${balance.planName}`} 
            balance={balance} 
            index={index}
          />
        ))}
      </div>

      {/* More indicator */}
      {hasMore && (
        <div className="text-center">
          <Link to="/services">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              + {hiddenCount} {hiddenCount === 1 ? 'serviço não exibido' : 'serviços não exibidos'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </motion.div>
  );
};

export default ServiceInventory;
