import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOffers } from '@/hooks/useOffers';
import { useCreateClientContract } from '@/hooks/useClientContracts';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ContractAssignDialogProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractAssignDialog({
  clientId,
  isOpen,
  onClose,
}: ContractAssignDialogProps) {
  const { user } = useAuth();
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');

  const { data: offers = [], isLoading: isLoadingOffers } = useOffers();
  const createContractMutation = useCreateClientContract();

  const handleAssign = () => {
    if (!selectedOfferId) {
      toast.error('Selecione uma oferta para atribuir');
      return;
    }

    if (!user?.Id) {
      toast.error('Usuário não autenticado');
      return;
    }

    createContractMutation.mutate(
      {
        offerId: selectedOfferId,
        clientId,
        assignedByUserId: user.Id,
      },
      {
        onSuccess: () => {
          onClose();
          setSelectedOfferId('');
        },
      }
    );
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir Oferta ao Cliente</DialogTitle>
          <DialogDescription>
            Selecione uma oferta comercial para atribuir a este cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Oferta Comercial</Label>
            {isLoadingOffers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="animate-spin">⏳</span>
                Carregando ofertas...
              </div>
            ) : offers.length === 0 ? (
              <div className="text-sm text-destructive">
                Nenhuma oferta disponível. Crie ofertas no catálogo primeiro.
              </div>
            ) : (
              <Select
                value={selectedOfferId}
                onValueChange={setSelectedOfferId}
                disabled={isLoadingOffers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma oferta..." />
                </SelectTrigger>
                <SelectContent>
                  {offers.map((offer) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{offer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {offer.videoQuantity} vídeos • {formatPrice(offer.price)} • {offer.contractType}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createContractMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedOfferId || createContractMutation.isPending}
          >
            {createContractMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Atribuindo...
              </>
            ) : (
              'Atribuir Oferta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
