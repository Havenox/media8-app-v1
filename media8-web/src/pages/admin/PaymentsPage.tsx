import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  DollarSign,
  Calendar,
  Check,
} from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

import { useInvoices, useConfirmPayment } from '@/hooks/useBilling';
import { Invoice, InvoiceStatus } from '@/types/billing';

// ==========================================
// FORM SCHEMA & HELPER
// ==========================================
interface ConfirmPaymentFormData {
  paymentMethod: string;
  transactionId?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PaymentsPage: React.FC = () => {
  const { toast } = useToast();
  
  // State for search and pagination
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Queries & Mutations
  const { data, isLoading } = useInvoices(
    page,
    10,
    statusFilter === 'All' ? null : statusFilter,
    searchTerm
  );

  const confirmPaymentMutation = useConfirmPayment();

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ConfirmPaymentFormData>({
    defaultValues: {
      paymentMethod: 'Pix',
      transactionId: '',
    },
  });

  const selectedMethod = watch('paymentMethod');

  // Total pages calculation
  const totalCount = data?.TotalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 10) || 1;

  // Open Payment Confirmation
  const openConfirmDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    reset({
      paymentMethod: 'Pix',
      transactionId: '',
    });
    setIsConfirmOpen(true);
  };

  // Submit Payment Confirmation
  const handleConfirmPayment = async (formData: ConfirmPaymentFormData) => {
    if (!selectedInvoice) return;

    try {
      await confirmPaymentMutation.mutateAsync({
        invoiceId: selectedInvoice.Id,
        request: {
          PaymentMethod: formData.paymentMethod,
          TransactionId: formData.transactionId,
        },
      });

      toast({
        title: 'Pagamento confirmado',
        description: `A fatura foi marcada como PAGA e os créditos foram liberados.`,
      });
      setIsConfirmOpen(false);
      setSelectedInvoice(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao confirmar',
        description: error.response?.data?.message || 'Ocorreu um erro ao confirmar o pagamento.',
        variant: 'destructive',
      });
    }
  };

  // Helper badge renderers
  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid':
        return (
          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 gap-1 rounded-sm">
            <CheckCircle2 className="h-3 w-3" />
            Pago
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-500 gap-1 rounded-sm">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'Overdue':
        return (
          <Badge variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-500 gap-1 rounded-sm">
            <AlertCircle className="h-3 w-3" />
            Vencido
          </Badge>
        );
      case 'Cancelled':
        return (
          <Badge variant="secondary" className="gap-1 rounded-sm">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Pagamentos</h1>
            <p className="text-sm text-muted-foreground">Monitore transações, faturas e confirme pagamentos manuais</p>
          </div>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as any);
            setPage(1);
          }}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-5 w-full md:w-[480px]">
            <TabsTrigger value="All">Todos</TabsTrigger>
            <TabsTrigger value="Pending">Pendentes</TabsTrigger>
            <TabsTrigger value="Paid">Pagos</TabsTrigger>
            <TabsTrigger value="Overdue">Vencidos</TabsTrigger>
            <TabsTrigger value="Cancelled">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Bar */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="w-32">Valor</TableHead>
              <TableHead className="w-40">Vencimento</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-40">Pagamento</TableHead>
              <TableHead className="w-28 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Carregando pagamentos...</p>
                </TableCell>
              </TableRow>
            ) : !data || data.Items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
                  <p className="text-muted-foreground font-semibold">Nenhuma fatura encontrada.</p>
                  <p className="text-xs text-muted-foreground">Tente alterar os filtros ou termo de busca.</p>
                </TableCell>
              </TableRow>
            ) : (
              data.Items.map((invoice) => (
                <TableRow key={invoice.Id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-foreground">{invoice.Description}</p>
                      {invoice.ContractOfferName && (
                        <p className="text-xs text-muted-foreground">
                          Contrato: {invoice.ContractOfferName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm text-foreground">{invoice.ClientName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{invoice.ClientEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {formatCurrency(invoice.Amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(invoice.DueDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.Status)}
                  </TableCell>
                  <TableCell>
                    {invoice.Status === 'Paid' ? (
                      <div className="space-y-0.5 text-xs">
                        <p className="text-foreground font-medium">
                          {invoice.PaymentMethod}
                        </p>
                        {invoice.TransactionId && (
                          <p className="text-muted-foreground font-mono text-[10px] truncate max-w-[150px]" title={invoice.TransactionId}>
                            Ref: {invoice.TransactionId}
                          </p>
                        )}
                        {invoice.PaidAt && (
                          <p className="text-muted-foreground text-[10px]">
                            Pago em: {formatDate(invoice.PaidAt)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.Status === 'Pending' && (
                      <Button
                        size="sm"
                        variant="premium"
                        onClick={() => openConfirmDialog(invoice)}
                        className="h-8 gap-1 px-3"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Confirmar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Mostrando faturas {((page - 1) * 10) + 1} a {Math.min(page * 10, totalCount)} de {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento Manual</DialogTitle>
            <DialogDescription>
              Registre a confirmação de recebimento para a fatura de <strong>{selectedInvoice?.ClientName}</strong>. 
              Isso mudará o status para PAGO e liberará imediatamente os créditos do ciclo.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 text-sm my-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descrição:</span>
                <span className="font-medium text-foreground">{selectedInvoice.Description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-bold text-primary">{formatCurrency(selectedInvoice.Amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimento:</span>
                <span className="font-medium text-foreground">{formatDate(selectedInvoice.DueDate)}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(handleConfirmPayment)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pagamento</Label>
              <Select
                value={selectedMethod}
                onValueChange={(val) => setValue('paymentMethod', val)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Transferência Bancária">Transferência Bancária</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">ID da Transação ou Observação (opcional)</Label>
              <Input
                id="transactionId"
                placeholder="Ex: E123456789... ou comprovante recebido"
                {...register('transactionId')}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="premium" disabled={confirmPaymentMutation.isPending}>
                {confirmPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Recebimento
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PaymentsPage;
