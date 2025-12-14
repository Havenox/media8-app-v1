import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Youtube, 
  Package, 
  Video,
  Calendar,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Plus,
  ShoppingCart,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ServiceBalanceAggregated, ServiceCategory } from '@/types/services';
import { cn } from '@/lib/utils';

interface ServiceBalanceCardProps {
  balance: ServiceBalanceAggregated;
  index?: number;
}

// Menu action type for extensibility
interface CardMenuAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: (balance: ServiceBalanceAggregated) => void;
  disabled?: (balance: ServiceBalanceAggregated) => boolean;
  hidden?: (balance: ServiceBalanceAggregated) => boolean;
}

const categoryIcons: Record<ServiceCategory, React.ElementType> = {
  reels: Smartphone,
  youtube: Youtube,
  pacote: Package,
  avulso: Video,
};

const categoryColors: Record<ServiceCategory, { bg: string; text: string; border: string }> = {
  reels: { 
    bg: 'bg-info/10', 
    text: 'text-info', 
    border: 'border-info/20' 
  },
  youtube: { 
    bg: 'bg-destructive/10', 
    text: 'text-destructive', 
    border: 'border-destructive/20' 
  },
  pacote: { 
    bg: 'bg-success/10', 
    text: 'text-success', 
    border: 'border-success/20' 
  },
  avulso: { 
    bg: 'bg-warning/10', 
    text: 'text-warning', 
    border: 'border-warning/20' 
  },
};

// Níveis de urgência baseados em dias restantes
type UrgencyLevel = 'normal' | 'attention' | 'warning' | 'critical';

const getUrgencyLevel = (days: number | undefined): UrgencyLevel => {
  if (days === undefined) return 'normal';
  if (days <= 1) return 'critical';
  if (days <= 3) return 'warning';
  if (days <= 7) return 'attention';
  return 'normal';
};

const urgencyConfig: Record<UrgencyLevel, { 
  icon: React.ElementType; 
  textClass: string; 
  bgClass: string;
  animate?: boolean;
}> = {
  normal: { 
    icon: RefreshCw, 
    textClass: 'text-muted-foreground', 
    bgClass: '' 
  },
  attention: { 
    icon: Clock, 
    textClass: 'text-warning', 
    bgClass: 'bg-warning/5' 
  },
  warning: { 
    icon: AlertTriangle, 
    textClass: 'text-orange-500', 
    bgClass: 'bg-orange-500/5' 
  },
  critical: { 
    icon: AlertCircle, 
    textClass: 'text-destructive', 
    bgClass: 'bg-destructive/5',
    animate: true 
  },
};

export const ServiceBalanceCard: React.FC<ServiceBalanceCardProps> = ({ 
  balance, 
  index = 0 
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const Icon = categoryIcons[balance.category];
  const colors = categoryColors[balance.category];
  
  // Determinar nível de urgência
  const daysRemaining = balance.isSubscription 
    ? balance.daysUntilRenewal 
    : balance.daysUntilExpiry;
  
  const urgencyLevel = getUrgencyLevel(daysRemaining);
  const urgency = urgencyConfig[urgencyLevel];
  const UrgencyIcon = urgency.icon;

  // Build the unique service key for pre-selection
  const serviceKey = `${balance.serviceType}::${balance.planName || 'default'}`;

  // Extensible menu actions
  const menuActions: CardMenuAction[] = [
    {
      id: 'new-order',
      label: 'Novo Pedido',
      icon: Plus,
      onClick: (b) => {
        navigate(`/orders/new?service=${encodeURIComponent(serviceKey)}`);
      },
      disabled: (b) => b.totalQuantity === 0,
    },
    {
      id: 'buy-more',
      label: 'Contratar mais',
      icon: ShoppingCart,
      onClick: (b) => {
        // Placeholder: navigate to landing page or purchase flow
        navigate('/');
      },
    },
    // Future actions can be added here:
    // {
    //   id: 'extend-deadline',
    //   label: 'Contratar prazo adicional',
    //   icon: Calendar,
    //   onClick: (b) => { ... },
    // },
  ];
  
  // Texto de status baseado no tipo e estado
  const getStatusInfo = () => {
    if (balance.isSubscription) {
      // Handle renewal text - 0 days means renewal is today/pending
      const getRenewalText = () => {
        if (balance.daysUntilRenewal === undefined) return 'Renovação pendente';
        if (balance.daysUntilRenewal === 0) return 'Renova hoje';
        return `Renova em ${balance.daysUntilRenewal} ${balance.daysUntilRenewal === 1 ? 'dia' : 'dias'}`;
      };
      const renewText = getRenewalText();
      
      if (balance.isZeroed) {
        return {
          badge: 'Esgotado',
          badgeVariant: 'secondary' as const,
          text: renewText,
          warning: 'Créditos renovam automaticamente',
        };
      }
      
      // Has credits but renewal approaching
      const isUrgent = urgencyLevel !== 'normal';
      return {
        badge: null,
        text: renewText,
        warning: isUrgent && balance.totalQuantity > 0
          ? `Use agora! ${balance.totalQuantity} crédito${balance.totalQuantity > 1 ? 's' : ''} não acumula${balance.totalQuantity > 1 ? 'm' : ''}.`
          : null,
      };
    }
    
    // Pacotes/Avulsos - handle expiry text with 0 days case
    const getExpiryText = () => {
      if (balance.daysUntilExpiry === undefined) return balance.planName || 'Sem validade';
      if (balance.daysUntilExpiry === 0) return 'Expira hoje';
      return `Expira em ${balance.daysUntilExpiry} ${balance.daysUntilExpiry === 1 ? 'dia' : 'dias'}`;
    };

    if (balance.isZeroed) {
      return {
        badge: 'Utilizado',
        badgeVariant: 'secondary' as const,
        text: getExpiryText(),
        warning: null,
      };
    }
    
    return {
      badge: null,
      text: getExpiryText(),
      warning: urgencyLevel !== 'normal' && balance.totalQuantity > 0
        ? `Use antes de expirar!`
        : null,
    };
  };

  const statusInfo = getStatusInfo();

  // Filter visible actions
  const visibleActions = menuActions.filter(
    (action) => !action.hidden || !action.hidden(balance)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Card 
            variant="elevated" 
            className={cn(
              'overflow-hidden transition-all duration-200 border-2 h-full relative cursor-pointer',
              colors.border,
              urgency.bgClass,
              balance.isZeroed && 'opacity-75',
              (isHovered || menuOpen) && 'shadow-lg ring-1 ring-primary/30 bg-accent/5'
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Icon & Info */}
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-xl', colors.bg)}>
                    <Icon className={cn('h-6 w-6', colors.text)} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{balance.name}</h3>
                    
                    {/* Status line */}
                    <div className={cn('flex items-center gap-2 text-sm', urgency.textClass)}>
                      <UrgencyIcon 
                        className={cn(
                          'h-3.5 w-3.5',
                          urgency.animate && 'animate-pulse'
                        )} 
                      />
                      <span className={urgencyLevel !== 'normal' ? 'font-medium' : ''}>
                        {statusInfo.text}
                      </span>
                    </div>
                    
                    {/* Warning message */}
                    {statusInfo.warning && (
                      <p className={cn('text-xs', urgency.textClass)}>
                        {statusInfo.warning}
                      </p>
                    )}
                    
                    {/* Badges */}
                    <div className="flex items-center gap-2 mt-1">
                      {statusInfo.badge && (
                        <Badge variant={statusInfo.badgeVariant} className="text-xs">
                          {statusInfo.badge}
                        </Badge>
                      )}
                      {balance.planName && !balance.isZeroed && (
                        <Badge variant="secondary" className="text-xs">
                          {balance.planName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="text-right">
                  <div className={cn(
                    'text-3xl font-bold',
                    balance.isZeroed ? 'text-muted-foreground' : colors.text
                  )}>
                    {balance.totalQuantity}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {balance.isZeroed ? 'utilizados' : 'disponíveis'}
                  </span>
                </div>
              </div>
            </CardContent>

            {/* Ellipsis indicator - appears on hover */}
            <AnimatePresence>
              {(isHovered || menuOpen) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-card border-border shadow-xl z-50"
        >
          {visibleActions.map((action) => {
            const ActionIcon = action.icon;
            const isDisabled = action.disabled?.(balance) ?? false;
            
            return (
              <DropdownMenuItem
                key={action.id}
                onSelect={(e) => {
                  e.preventDefault();
                  if (!isDisabled) {
                    action.onClick(balance);
                  }
                }}
                disabled={isDisabled}
                className={cn(
                  'flex items-center gap-2 cursor-pointer',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ActionIcon className="h-4 w-4" />
                <span>{action.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

export default ServiceBalanceCard;
