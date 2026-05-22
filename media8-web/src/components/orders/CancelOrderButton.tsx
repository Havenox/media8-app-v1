import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, Clock, Loader2, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface CancelOrderButtonProps {
  orderId: string;
  createdAt: string;
  cancellationWindowHours: number;
  onSuccess?: () => void;
}

/**
 * Botão de cancelamento com contador regressivo e confirmação.
 * Gerencia estados: vigente (com contador), expirado (desabilitado), e confirmação.
 */
const CancelOrderButton: React.FC<CancelOrderButtonProps> = ({
orderId,
createdAt,
cancellationWindowHours = 24,
onSuccess,
}) => {
// Debug: log das props
console.log('CancelOrderButton props:', { orderId, createdAt, cancellationWindowHours });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Calcula tempo restante
  useEffect(() => {
    const createdAtDate = new Date(createdAt);
    const deadline = new Date(createdAtDate.getTime() + cancellationWindowHours * 60 * 60 * 1000);
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const deadlineTime = deadline.getTime();
      const diff = deadlineTime - now;
      
      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
      } else {
        setTimeLeft(diff);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Atualiza a cada segundo
    return () => clearInterval(interval);
  }, [createdAt, cancellationWindowHours]);

  // Formata tempo restante (HH:mm:ss ou mm:ss)
  const formatTimeLeft = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Mutação de cancelamento
  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancel(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      toast({
        title: 'Pedido cancelado com sucesso!',
        description: 'O saldo foi estornado automaticamente.',
      });
      setIsDialogOpen(false);
      onSuccess?.();
    },
onError: (error: any) => {
// Debug: log do erro completo
console.log('CancelOrderButton onError:', error);
console.log('Error structure:', {
status: error.response?.status,
data: error.response?.data,
message: error.response?.data?.message,
errorCode: error.response?.data?.errorCode,
});

// Tratamento específico para erro 422 (Business Rule)
if (error.response?.status === 422) {
const errorCode = error.response.data?.errorCode;
const message = error.response.data?.message || 'Regra de negócio violada.';

console.log('Business rule error:', { errorCode, message });

if (errorCode === 'CANCELLATION_WINDOW_EXPIRED') {
toast({
title: 'Prazo de cancelamento expirado',
description: message,
variant: 'destructive',
});
} else if (errorCode === 'ORDER_ALREADY_CANCELLED') {
toast({
title: 'Pedido já cancelado',
description: message,
variant: 'destructive',
});
} else {
toast({
title: 'Não foi possível cancelar',
description: message,
variant: 'destructive',
});
}
} else {
// Erro genérico
const fallbackMessage = error.response?.data?.message || error.message || 'Tente novamente mais tarde.';
console.log('Generic error:', fallbackMessage);

toast({
title: 'Erro ao cancelar pedido',
description: fallbackMessage,
variant: 'destructive',
});
}
setIsDialogOpen(false);
},
  });

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  // Se expirado, exibe botão desabilitado com mensagem
  if (isExpired) {
    return (
      <Button variant="outline" disabled className="w-full gap-2">
        <AlertCircle className="h-4 w-4" />
        Prazo de cancelamento expirado
      </Button>
    );
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full gap-2"
          disabled={cancelMutation.isPending}
        >
          {cancelMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Cancelando...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Cancelar Pedido
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Confirmar Cancelamento
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-3">
              <p>
                Você está prestes a cancelar este pedido. O saldo será estornado automaticamente para o lote de origem.
              </p>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    Prazo restante: {formatTimeLeft(timeLeft)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Após este prazo, o cancelamento deverá ser feito diretamente com o suporte.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja prosseguir?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cancelando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar Cancelamento
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelOrderButton;
