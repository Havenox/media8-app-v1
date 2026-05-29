import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Plus,
  RefreshCw,
  Archive,
  RotateCcw,
  MoreVertical,
  Calendar,
  Clock,
  Film,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMyClientContracts,
  useArchiveClientContract,
  useUnarchiveClientContract
} from '@/hooks/useClientContracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSequentialId } from '@/lib/formatters';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch contracts using React Query hooks
  const { data: contracts = [], isLoading, refetch } = useMyClientContracts(activeTab === 'archived');
  
  const archiveMutation = useArchiveClientContract();
  const unarchiveMutation = useUnarchiveClientContract();

  const handleArchive = async (id: string) => {
    archiveMutation.mutate(id, {
      onSuccess: () => refetch()
    });
  };

  const handleUnarchive = async (id: string) => {
    unarchiveMutation.mutate(id, {
      onSuccess: () => refetch()
    });
  };

  // Filter based on search query
  const filteredContracts = contracts.filter((contract) => {
    const offerName = contract.SnapshotOfferName || contract.Offer?.Name || '';
    const sequentialIdStr = contract.SequentialId ? `Contrato #${String(contract.SequentialId).padStart(4, '0')}` : '';
    const query = searchQuery.toLowerCase();
    
    return (
      offerName.toLowerCase().includes(query) ||
      sequentialIdStr.toLowerCase().includes(query) ||
      (contract.SnapshotVideoFormatName && contract.SnapshotVideoFormatName.toLowerCase().includes(query)) ||
      (contract.SnapshotEditingStyleName && contract.SnapshotEditingStyleName.toLowerCase().includes(query))
    );
  });

  const getContractTypeBadge = (contractType: string | undefined, isInactive: boolean) => {
    if (!contractType) return null;

    if (isInactive) {
      return (
        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-semibold bg-neutral-200 text-neutral-500 border border-neutral-300">
          {contractType}
        </Badge>
      );
    }

    const styles: Record<string, string> = {
      Assinatura: "bg-[#7B0A0A]/10 text-[#7B0A0A] border-[#7B0A0A]/20",
      Pacote: "bg-[#400404]/10 text-[#400404] border-[#400404]/20",
      Avulso: "bg-amber-600/10 text-amber-800 border-amber-600/20"
    };

    const style = styles[contractType] || "bg-[#400404]/10 text-[#400404] border-[#400404]/20";

    return (
      <Badge variant="secondary" className={cn("text-[10px] px-2 py-0.5 font-semibold border rounded-sm", style)}>
        {contractType}
      </Badge>
    );
  };

  const renderSkeletonList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((n) => (
        <Card key={n} className="border-[#E8E0D0] bg-[#FFFBED] min-h-[260px] flex flex-col justify-between p-5">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 bg-[#E8E0D0]/60" />
              <Skeleton className="h-5 w-16 bg-[#E8E0D0]/60" />
            </div>
            <Skeleton className="h-6 w-40 bg-[#E8E0D0]/60" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full bg-[#E8E0D0]/60" />
              <Skeleton className="h-4 w-3/4 bg-[#E8E0D0]/60" />
            </div>
          </div>
          <div className="pt-4 border-t border-dashed border-[#E8E0D0]">
            <Skeleton className="h-8 w-full bg-[#E8E0D0]/60" />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#400404] tracking-tight flex items-center gap-2.5">
            <FileText className="h-8 w-8 text-[#7B0A0A]" />
            Meus Contratos
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            Visualize o histórico de suas contratações, snapshots imutáveis e vigências ativas na plataforma Media8.
          </p>
        </div>
        
        {user?.Role === 'Client' && (
          <Button
            onClick={() => navigate('/')}
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-bold shrink-0 shadow-md gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Contratação
          </Button>
        )}
      </div>

      {/* Tabs & Search Filter Block */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as 'active' | 'archived');
          setSearchQuery('');
        }}
        className="w-full space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E8E0D0]">
          <TabsList className="bg-[#E8E0D0]/30 border border-[#E8E0D0] p-1 h-10">
            <TabsTrigger
              value="active"
              className="text-[#400404] data-[state=active]:bg-[#400404] data-[state=active]:text-[#FFFBED] px-4 py-1.5 text-xs font-bold transition-all"
            >
              Ativos
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="text-[#400404] data-[state=active]:bg-[#400404] data-[state=active]:text-[#FFFBED] px-4 py-1.5 text-xs font-bold transition-all"
            >
              Arquivados
            </TabsTrigger>
          </TabsList>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por plano, formato ou id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-[#E8E0D0] focus:ring-primary/20 bg-[#FFFBED]"
            />
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          renderSkeletonList()
        ) : (
          <TabsContent value={activeTab} className="mt-0 focus-visible:outline-none">
            {filteredContracts.length === 0 ? (
              <Card className="border-[#E8E0D0] bg-[#FFFBED] border-dashed p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
                <CardHeader className="p-0">
                  <div className="mx-auto w-12 h-12 rounded-full bg-[#E8E0D0]/20 flex items-center justify-center text-[#400404]/60 mb-4">
                    <FileText className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-bold text-[#400404]">
                    {activeTab === 'archived' ? 'Nenhum contrato arquivado' : 'Nenhum contrato ativo'}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs max-w-sm mx-auto mt-2">
                    {activeTab === 'archived'
                      ? 'Você não possui contratos arquivados no momento.'
                      : 'Você ainda não possui contratos ativos. Que tal contratar sua primeira oferta?'}
                  </CardDescription>
                </CardHeader>
                {activeTab === 'active' && user?.Role === 'Client' && (
                  <Button
                    onClick={() => navigate('/')}
                    className="mt-6 bg-[#7B0A0A] hover:bg-[#5C1212] text-white font-bold px-6 shadow-sm"
                  >
                    Ver Planos Disponíveis
                  </Button>
                )}
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {filteredContracts.map((contract) => {
                    const isSubscription = contract.SnapshotContractType === 'Assinatura';
                    const expDate = contract.ExpiresAt ? new Date(contract.ExpiresAt) : null;
                    const isDateExpired = expDate ? expDate < new Date() : false;
                    const isContractExpired = contract.Status === 'Expired' || isDateExpired;
                    const isCancelled = contract.Status === 'Cancelled';
                    
                    const isInactive = isContractExpired || isCancelled;

                    // Commercial snapshot details
                    const offerName = contract.SnapshotOfferName || contract.Offer?.Name || 'Contrato Comercial';
                    const videoQty = contract.SnapshotVideoQuantity || 0;
                    const price = contract.SnapshotPrice || 0;
                    const deliveryDays = contract.SnapshotDeliveryDays || 0;
                    const validityDays = contract.SnapshotValidityDays || 0;
                    const warrantyDays = contract.SnapshotWarrantyDays || 0;
                    const fidelityMonths = warrantyDays > 0 ? Math.round(warrantyDays / 30) : 0;

                    // Technical snapshot details
                    const formatName = contract.SnapshotVideoFormatName || 'Format Padrão';
                    const editStyle = contract.SnapshotEditingStyleName || 'Estilo Clássico';
                    const duration = contract.SnapshotMaxDurationSeconds || 0;

                    return (
                      <motion.div
                        key={contract.Id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full relative"
                      >
                        <Card
                          className={cn(
                            "relative overflow-hidden transition-all duration-300 border-l-4 p-5 flex flex-col justify-between w-full h-full select-none group shadow-sm hover:shadow-md",
                            isInactive
                              ? "bg-[#F3F4F6]/70 border-[#E5E7EB] border-l-[#9CA3AF] opacity-75"
                              : cn(
                                  "bg-[#FFFBED] border-[#E8E0D0]",
                                  isSubscription 
                                    ? "border-l-[#7B0A0A] hover:ring-1 hover:ring-[#7B0A0A]/20" 
                                    : "border-l-[#400404] hover:ring-1 hover:ring-[#400404]/20"
                                )
                          )}
                        >
                          <div>
                            {/* Card Top: SequentialID & Dropdown Menu */}
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div>
                                <span className={cn(
                                  "text-[10px] font-mono font-bold leading-none block",
                                  isInactive ? "text-neutral-400" : "text-[#7B0A0A]"
                                )}>
                                  {formatSequentialId(contract.SequentialId, 'Contrato')}
                                </span>
                                <h3 className={cn(
                                  "text-lg font-bold mt-1 tracking-tight truncate max-w-[200px]",
                                  isInactive ? "text-neutral-500" : "text-[#400404]"
                                )} title={offerName}>
                                  {offerName}
                                </h3>
                              </div>

                              <div className="flex items-center gap-1">
                                {getContractTypeBadge(contract.SnapshotContractType, isInactive)}
                                
                                {/* Dropdown Menu trigger */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        "h-7 w-7 rounded-full transition-opacity",
                                        "opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100",
                                        isInactive ? "hover:bg-neutral-200" : "hover:bg-[#E8E0D0]/30"
                                      )}
                                    >
                                      <MoreVertical className="h-4 w-4 text-[#400404]" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48 bg-[#FFFBED] border-[#E8E0D0] shadow-xl z-50"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => navigate('/dashboard')}
                                      className="flex items-center gap-2 cursor-pointer text-[#400404] hover:bg-[#E8E0D0]/30 font-medium"
                                    >
                                      <Sparkles className="h-4 w-4" />
                                      <span>Ver no Dashboard</span>
                                    </DropdownMenuItem>

                                    {activeTab === 'active' ? (
                                      <DropdownMenuItem
                                        onClick={() => handleArchive(contract.Id)}
                                        className="flex items-center gap-2 cursor-pointer text-orange-800 hover:bg-orange-50 focus:bg-orange-50 font-medium"
                                      >
                                        <Archive className="h-4 w-4" />
                                        <span>Arquivar</span>
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() => handleUnarchive(contract.Id)}
                                        className="flex items-center gap-2 cursor-pointer text-emerald-800 hover:bg-emerald-50 focus:bg-emerald-50 font-medium"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                        <span>Restaurar</span>
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Details Snapshot Content */}
                            <div className="space-y-2 mt-4 text-[12px] text-muted-foreground">
                              {/* Tech Details Row */}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className={cn(
                                  "font-semibold flex items-center gap-1 shrink-0",
                                  isInactive ? "text-neutral-400" : "text-neutral-700"
                                )}>
                                  <Film className="h-3 w-3" /> {formatName}
                                </span>
                                <span className="opacity-40">•</span>
                                <span className="shrink-0">{editStyle}</span>
                                <span className="opacity-40">•</span>
                                <span className="shrink-0 font-mono text-[11px]">{duration}s</span>
                              </div>

                              {/* Technical details list */}
                              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-dashed border-[#E8E0D0]/80">
                                <div>
                                  <span className="text-[10px] text-muted-foreground/70 uppercase font-bold block leading-none">Vídeos inclusos</span>
                                  <span className={cn("text-sm font-extrabold mt-0.5 block", isInactive ? "text-neutral-500" : "text-[#400404]")}>
                                    {videoQty} créditos
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground/70 uppercase font-bold block leading-none">Prazo de Entrega</span>
                                  <span className={cn("text-sm font-extrabold mt-0.5 block", isInactive ? "text-neutral-500" : "text-[#400404]")}>
                                    {deliveryDays} {deliveryDays === 1 ? 'dia' : 'dias'} úteis
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground/70 uppercase font-bold block leading-none">Valor Snapshot</span>
                                  <span className={cn("text-sm font-extrabold mt-0.5 block", isInactive ? "text-neutral-500" : "text-[#400404]")}>
                                    {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground/70 uppercase font-bold block leading-none">Vigência Ciclo</span>
                                  <span className={cn("text-sm font-extrabold mt-0.5 block", isInactive ? "text-neutral-500" : "text-[#400404]")}>
                                    {validityDays > 0 ? `${validityDays} dias` : 'Sem expiração'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Expiry Info & Quick action */}
                          <div className="mt-5 pt-3 border-t border-[#E8E0D0] flex items-center justify-between text-[11px] gap-2">
                            {/* Fidelity / Expiry Date */}
                            <div className="flex-1 min-w-0">
                              {isCancelled ? (
                                <span className="text-red-600 font-bold block truncate">Contrato Cancelado</span>
                              ) : isContractExpired ? (
                                <div className="flex items-center gap-1 text-neutral-500 font-medium min-w-0">
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    Expirou em: {expDate ? format(expDate, 'dd/MM/yyyy') : '-'}
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-muted-foreground/80 font-medium min-w-0">
                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-[#7B0A0A]/70" />
                                    <span className="truncate">
                                      Vence: {expDate ? format(expDate, 'dd/MM/yyyy') : 'Sem prazo'}
                                    </span>
                                  </div>
                                  {isSubscription && fidelityMonths > 0 && (
                                    <span className="text-[10px] font-bold text-[#7B0A0A] block">
                                      Período de Fidelidade: {fidelityMonths} meses
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            {user?.Role === 'Client' && !isInactive && (
                              <Button
                                size="sm"
                                onClick={() => navigate('/orders/new')}
                                className={cn(
                                  "h-7 px-3 text-[11px] font-bold text-white shrink-0 shadow-sm",
                                  isSubscription ? "bg-[#7B0A0A] hover:bg-[#5C1212]" : "bg-[#400404] hover:bg-[#5C1212]"
                                )}
                              >
                                Novo Pedido
                              </Button>
                            )}

                            {user?.Role === 'Client' && isInactive && isSubscription && (
                              <Button
                                size="sm"
                                onClick={() => navigate('/')}
                                className="h-7 px-3 text-[11px] font-bold bg-[#400404] hover:bg-[#5C1212] text-white shrink-0 shadow-sm"
                              >
                                Renovar
                              </Button>
                            )}
                          </div>

                          {/* Decorative Background Icon */}
                          <div className="absolute -right-3 -bottom-3 opacity-[0.03] pointer-events-none text-[#400404]">
                            <FileText className="h-16 w-16 transform -rotate-12" />
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ContractsPage;
