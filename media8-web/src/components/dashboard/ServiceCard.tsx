import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
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
  ShoppingCart,
  CreditCard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { UnifiedServiceBalance } from '@/types/services';

// ==========================================
// UTILS & MAPS
// ==========================================

const getIcon = (name: string) => {
  if (name.toLowerCase().includes('reels')) return Smartphone;
  if (name.toLowerCase().includes('youtube')) return Youtube;
  if (name.toLowerCase().includes('pacote')) return Package;
  return Video;
};

const renderContractTypeBadge = (contractType: string, isExpired?: boolean) => {
  if (!contractType || contractType === 'Desconhecido') return null;
  
  if (isExpired) {
    return (
      <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 h-4 font-semibold border rounded-sm bg-neutral-200 text-neutral-500 border-neutral-300 hover:bg-neutral-200">
        {contractType}
      </Badge>
    );
  }
  
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

const getExpirationInfo = (lot: UnifiedServiceBalance) => {
  const isSubscription = lot.ContractType === 'Assinatura';
  
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
      isExpired: false,
      dateString: null,
      warningText: null
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
  let isExpired = daysRemaining < 0;
  let warningText: string | null = null;

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

    if (lot.RemainingQuantity === 0) {
      warningText = 'Créditos renovados automaticamente';
    } else if (isUrgent && lot.RemainingQuantity > 0) {
      warningText = 'Saldo não-acumulativo • Use seus créditos!';
    }
  } else {
    if (daysRemaining < 0) {
      text = `Expirado em ${dateString}`;
      isUrgent = true;
      warningText = 'Contrato expirado • Saldo inutilizado!';
    } else if (daysRemaining === 0) {
      text = 'Expira hoje!';
      isUrgent = true;
      warningText = 'Expira hoje • Use antes que acabe!';
    } else if (daysRemaining === 1) {
      text = 'Expira amanhã!';
      isUrgent = true;
      warningText = 'Expira amanhã • Use antes que expire!';
    } else {
      text = `Válido até ${dateString} (restam ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'})`;
      if (daysRemaining <= 7) {
        isUrgent = true;
        warningText = 'Prazo acabando • Utilize antes que expire!';
      }
    }
  }

  return {
    text,
    daysRemaining,
    isUrgent,
    isExpired,
    dateString,
    warningText
  };
};

const getFidelityInfo = (purchaseDateStr: string, expiresAtStr: string | null, warrantyDays: number | undefined) => {
  if (!warrantyDays || warrantyDays <= 0) return null;
  const totalMonths = Math.round(warrantyDays / 30);
  if (totalMonths <= 0) return null;

  const purchaseDate = new Date(purchaseDateStr);
  
  // Calcula o mês atual cruzando a data de início (PurchaseDate) com a data de expiração do lote (ExpiresAt)
  let targetDate = new Date();
  if (expiresAtStr) {
    targetDate = new Date(expiresAtStr);
  } else {
    // Fallback: se não tiver ExpiresAt, calcula +30 dias a partir da data de compra/cadastro
    targetDate = new Date(purchaseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  
  const diffTime = targetDate.getTime() - purchaseDate.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const currentMonth = Math.min(totalMonths, Math.max(1, Math.round(diffDays / 30)));
  
  return {
    text: `Fidelidade: Mês ${currentMonth}/${totalMonths}`,
    currentMonth,
    totalMonths
  };
};

// ==========================================
// 1. GRID CARD VIEW (Premium UX/UI with warnings and fidelity)
// ==========================================

export const ServiceCard = ({
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
  const fidelityInfo = isSubscription ? getFidelityInfo(lot.PurchaseDate, lot.ExpiresAt, lot.SnapshotWarrantyDays) : null;

  const isBlocked = !!lot.InvoiceId && lot.InvoiceStatus !== 'Paid';
  const isOverdue = lot.InvoiceStatus === 'Overdue';

  const percentConsumed = lot.TotalQuantity > 0 
    ? Math.round(((lot.TotalQuantity - lot.RemainingQuantity) / lot.TotalQuantity) * 100)
    : 0;

  const cardContent = (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-md border-l-4 p-5 flex flex-col justify-between w-full min-h-[220px] h-full select-none",
      expInfo.isExpired
        ? "bg-[#F3F4F6]/70 border-[#E5E7EB] border-l-[#9CA3AF] opacity-75"
        : isBlocked
          ? "bg-[#FFFDF0] border-amber-200 border-l-amber-500"
          : cn(
              "bg-[#FFFBED] border-[#E8E0D0]",
              isSubscription 
                ? "border-l-[#7B0A0A]" 
                : expInfo.isUrgent 
                  ? "border-l-amber-600" 
                  : "border-l-[#400404]"
            ),
      !canConsume && "cursor-pointer",
      !canConsume && !expInfo.isExpired && (isHovered || menuOpen) && (
        isBlocked
          ? "shadow-lg ring-1 ring-amber-500/20 bg-[#FFFDF5]"
          : "shadow-lg ring-1 ring-primary/20 bg-[#FFFDF6]"
      )
    )}>
      {/* Top Section: Title & Credits Row */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-1.5 rounded-full text-[#FFFBED]",
            expInfo.isExpired
              ? "bg-[#9CA3AF]"
              : isBlocked
                ? "bg-amber-500"
                : isSubscription 
                  ? "bg-[#7B0A0A]" 
                  : expInfo.isUrgent 
                    ? "bg-amber-600" 
                    : "bg-[#400404]"
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap max-w-[170px] sm:max-w-[200px]">
              <CardTitle className={cn(
                "text-base font-bold line-clamp-1 leading-none",
                expInfo.isExpired ? "text-neutral-500" : "text-[#400404]"
              )} title={lot.SnapshotOfferName}>
                {lot.SnapshotOfferName}
              </CardTitle>
              <div className="flex items-center gap-1 flex-wrap">
                {renderContractTypeBadge(lot.ContractType, expInfo.isExpired)}
                {fidelityInfo && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 h-4 font-semibold uppercase tracking-wider rounded-sm",
                      expInfo.isExpired 
                        ? "border-neutral-300 bg-neutral-100 text-neutral-500" 
                        : "border-[#7B0A0A]/20 bg-[#7B0A0A]/5 text-[#7B0A0A]"
                    )}
                  >
                    Mês {fidelityInfo.currentMonth}/{fidelityInfo.totalMonths}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lot.SnapshotVideoFormatName} ({lot.SnapshotMaxDurationSeconds}s)
            </p>
          </div>
        </div>

        {/* Credits */}
        <div className="text-right shrink-0">
          <span className={cn(
            "text-lg font-extrabold",
            expInfo.isExpired ? "text-neutral-500" : "text-[#400404]"
          )}>
            {lot.RemainingQuantity}
          </span>
          <span className="text-[11px] text-muted-foreground ml-0.5">
            /{lot.TotalQuantity}
          </span>
          <p className="text-[10px] text-muted-foreground leading-none">créditos</p>
        </div>
      </div>

      {/* Progress Bar */}
      {!expInfo.isExpired && (
        <div className="w-full my-2">
          <div className={cn(
            "w-full h-1 rounded-full overflow-hidden",
            isBlocked || expInfo.isExpired ? "bg-neutral-200" : "bg-[#E8E0D0]/50"
          )}>
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isBlocked || expInfo.isExpired
                  ? "bg-neutral-400"
                  : isSubscription ? "bg-[#7B0A0A]" : expInfo.isUrgent ? "bg-amber-600" : "bg-[#400404]"
              )}
              style={{ width: `${percentConsumed}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
            <span>{percentConsumed}% consumido</span>
            <span>{lot.RemainingQuantity} restantes</span>
          </div>
        </div>
      )}

      {/* UX Warning Banner (Prazo acabando, rollover, etc.) */}
      {(() => {
        const warningText = isBlocked 
          ? (isOverdue 
              ? 'Fatura Atrasada • Saldo bloqueado aguardando pagamento' 
              : 'Fatura Pendente • Saldo bloqueado aguardando pagamento')
          : expInfo.warningText;
        return warningText ? (
          <div className={cn(
            "flex items-center gap-1.5 text-[10px] font-semibold py-1 px-2 rounded-md my-2 w-full border",
            isBlocked
              ? "bg-amber-500/10 text-amber-800 border-amber-500/20"
              : expInfo.isExpired
                ? "bg-red-500/10 text-red-700 border-red-500/20"
                : "bg-amber-500/10 text-amber-800 border-amber-500/20"
          )}>
            {isBlocked || !expInfo.isExpired ? (
              <AlertTriangle className="h-3 w-3 shrink-0" />
            ) : (
              <AlertCircle className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">{warningText}</span>
          </div>
        ) : null;
      })()}

      {/* Footer & Action Row */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-dashed border-[#E8E0D0] text-[11px]">
        {/* Renewal / Expiry */}
        <div className="flex-1 min-w-0">
          {isSubscription ? (
            <div className={cn(
              "flex items-center gap-1 min-w-0",
              expInfo.isExpired
                ? "text-neutral-500 font-medium"
                : expInfo.isUrgent 
                  ? "text-orange-600 font-bold" 
                  : "text-[#7B0A0A] font-medium"
            )}>
              <RefreshCw className={cn("h-3 w-3 shrink-0", expInfo.isUrgent && !expInfo.isExpired && "animate-spin")} style={{ animationDuration: '4s' }} />
              <span className="truncate" title={expInfo.text}>{expInfo.text}</span>
            </div>
          ) : (
            <div className={cn(
              "flex items-center gap-1 min-w-0",
              expInfo.isExpired
                ? "text-neutral-500 font-medium"
                : expInfo.isUrgent 
                  ? "text-orange-600 font-bold" 
                  : "text-amber-900/70"
            )}>
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate" title={expInfo.text}>{expInfo.text}</span>
            </div>
          )}
        </div>

        {/* Consume Button */}
        {canConsume && (
          <div className="flex items-center gap-1.5 shrink-0">
            {isBlocked && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/admin/payments');
                }}
                className="h-7 px-3 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                Pagar Fatura
              </Button>
            )}
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onConsume?.(lot);
              }}
              disabled={lot.RemainingQuantity <= 0 || expInfo.isExpired || isBlocked}
              className={cn(
                "h-7 px-3 text-[11px] font-bold text-[#FFFBED] shrink-0",
                isSubscription ? "bg-[#7B0A0A] hover:bg-[#5C1212]" : "bg-[#400404] hover:bg-[#5C1212]"
              )}
            >
              Usar
            </Button>
          </div>
        )}

        {!canConsume && isBlocked && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/admin/payments');
            }}
            className="h-7 px-3 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            Pagar Fatura
          </Button>
        )}
      </div>

      {/* Background decoration */}
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <Icon className="h-16 w-16 transform -rotate-12" />
      </div>

      {/* Ellipsis indicator - appears on hover when not in consume mode */}
      {!canConsume && !isBlocked && (
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
      className="h-full w-full relative"
    >
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          {cardContent}
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-[#FFFBED] border-[#E8E0D0] shadow-xl z-50"
        >
          {isBlocked ? (
            <DropdownMenuItem 
              onClick={() => navigate('/admin/payments')}
              className="flex items-center gap-2 cursor-pointer text-amber-800 hover:bg-amber-500/10 focus:bg-amber-500/10 font-semibold"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pagar Fatura</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={() => navigate(`/orders/new?lotId=${lot.Id}`)}
              disabled={expInfo.isExpired}
              className={cn(
                "flex items-center gap-2 cursor-pointer text-[#400404] hover:bg-[#E8E0D0]/30 focus:bg-[#E8E0D0]/30 font-medium",
                expInfo.isExpired && "opacity-50 cursor-not-allowed"
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Novo Pedido</span>
            </DropdownMenuItem>
          )}
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

// ==========================================
// 2. LIST ROW VIEW (For stack variants)
// ==========================================

export const ServiceListItem = ({
  lot,
  canConsume,
  onConsume
}: {
  lot: UnifiedServiceBalance;
  canConsume: boolean;
  onConsume?: (lot: UnifiedServiceBalance) => void;
}) => {
  const navigate = useNavigate();
  const Icon = getIcon(lot.SnapshotVideoFormatName);
  const isSubscription = lot.ContractType === 'Assinatura';
  const expInfo = getExpirationInfo(lot);
  const fidelityInfo = isSubscription ? getFidelityInfo(lot.PurchaseDate, lot.ExpiresAt, lot.SnapshotWarrantyDays) : null;
  
  const isBlocked = !!lot.InvoiceId && lot.InvoiceStatus !== 'Paid';
  const isOverdue = lot.InvoiceStatus === 'Overdue';

  const percentConsumed = lot.TotalQuantity > 0 
    ? Math.round(((lot.TotalQuantity - lot.RemainingQuantity) / lot.TotalQuantity) * 100)
    : 0;

  return (
    <div className={cn(
      "relative rounded-lg p-3 border transition-all border-l-4",
      expInfo.isExpired
        ? "bg-[#F3F4F6]/70 border-[#E5E7EB] border-l-[#9CA3AF] opacity-75"
        : isBlocked
          ? "bg-[#FFFDF0] border-amber-200 border-l-amber-500"
          : cn(
              "bg-[#FFFBED] border-[#E8E0D0] hover:bg-muted/50",
              isSubscription 
                ? "border-l-[#7B0A0A]" 
                : expInfo.isUrgent
                  ? "border-l-amber-600"
                  : "border-l-[#400404]"
            )
    )}>
      {/* Main Flex Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Left Section: Icon, Title, Format */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-1.5 rounded-md text-white shrink-0",
            expInfo.isExpired
              ? "bg-[#9CA3AF]"
              : isBlocked
                ? "bg-amber-500"
                : isSubscription ? "bg-[#7B0A0A]" : expInfo.isUrgent ? "bg-amber-600" : "bg-[#400404]"
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn(
                "text-sm font-bold leading-none",
                expInfo.isExpired ? "text-neutral-500" : "text-[#400404]"
              )}>
                {lot.SnapshotOfferName}
              </h4>
              <div className="flex items-center gap-1">
                {renderContractTypeBadge(lot.ContractType, expInfo.isExpired)}
                {fidelityInfo && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[8px] px-1 h-3.5 font-semibold",
                      expInfo.isExpired 
                        ? "border-neutral-300 bg-neutral-100 text-neutral-500" 
                        : "border-[#7B0A0A]/20 bg-[#7B0A0A]/5 text-[#7B0A0A]"
                    )}
                  >
                    Mês {fidelityInfo.currentMonth}/{fidelityInfo.totalMonths}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lot.SnapshotVideoFormatName} ({lot.SnapshotMaxDurationSeconds}s)
            </p>
          </div>
        </div>

        {/* Right Section: Credits & Usage */}
        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
          <div className="text-right">
            <span className={cn(
              "text-base font-extrabold",
              expInfo.isExpired ? "text-neutral-500" : "text-[#400404]"
            )}>
              {lot.RemainingQuantity}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              / {lot.TotalQuantity} créditos
            </span>
          </div>

          {canConsume ? (
            <div className="flex items-center gap-2">
              {isBlocked && (
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => navigate('/admin/payments')}
                >
                  Pagar Fatura
                </Button>
              )}
              <Button
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs font-semibold text-[#FFFBED]",
                  isSubscription 
                    ? "bg-[#7B0A0A] hover:bg-[#5C1212]" 
                    : "bg-[#400404] hover:bg-[#5C1212]"
                )}
                onClick={() => onConsume?.(lot)}
                disabled={lot.RemainingQuantity <= 0 || expInfo.isExpired || isBlocked}
              >
                Usar
              </Button>
            </div>
          ) : (
            isBlocked && (
              <Button
                size="sm"
                className="h-7 px-3 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => navigate('/admin/payments')}
              >
                Pagar Fatura
              </Button>
            )
          )}
        </div>
      </div>

      {/* Thin elegant Progress Bar */}
      {!expInfo.isExpired && (
        <div className="w-full mt-2.5">
          <div className={cn(
            "w-full h-1 rounded-full overflow-hidden",
            isBlocked || expInfo.isExpired ? "bg-neutral-200" : "bg-[#E8E0D0]/50"
          )}>
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isBlocked || expInfo.isExpired
                  ? "bg-neutral-400"
                  : isSubscription ? "bg-[#7B0A0A]" : expInfo.isUrgent ? "bg-amber-600" : "bg-[#400404]"
              )}
              style={{ width: `${percentConsumed}%` }}
            />
          </div>
        </div>
      )}

      {/* Warning message */}
      {(() => {
        const warningText = isBlocked 
          ? (isOverdue 
              ? 'Fatura Atrasada • Saldo bloqueado aguardando pagamento' 
              : 'Fatura Pendente • Saldo bloqueado aguardando pagamento')
          : expInfo.warningText;
        return warningText ? (
          <div className={cn(
            "flex items-center gap-1.5 text-[9px] font-semibold py-0.5 px-1.5 rounded mt-2 border w-fit",
            isBlocked
              ? "bg-amber-500/10 text-amber-800 border-amber-500/10"
              : expInfo.isExpired
                ? "bg-red-500/10 text-red-700 border-red-500/10"
                : "bg-amber-500/10 text-amber-800 border-amber-500/10"
          )}>
            {isBlocked || !expInfo.isExpired ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            <span>{warningText}</span>
          </div>
        ) : null;
      })()}

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
