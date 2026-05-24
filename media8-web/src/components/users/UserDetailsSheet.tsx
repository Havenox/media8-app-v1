import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Edit,
  Archive,
  Package,
  Calendar,
  AlertTriangle,
  Mail,
  Clock,
  Loader2
  } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { User as UserType } from '@/types/api';
import { ServiceBalanceList } from '@/components/dashboard/ServiceBalanceList';
import { useClientContracts } from '@/hooks/useClientContracts';

interface UserDetailsSheetProps {
user: UserType | null;
open: boolean;
onOpenChange: (open: boolean) => void;
onEdit: (user: UserType) => void;
onAssignContract: (user: UserType) => void;
onDelete: (userId: string) => void;
isDeleting?: boolean;
}

const UserDetailsSheet: React.FC<UserDetailsSheetProps> = ({
  user,
  open,
  onOpenChange,
  onEdit,
  onAssignContract,
  onDelete,
  isDeleting = false,
}) => {
  if (!user) return null;

  const { data: contracts = [], isLoading: isLoadingContracts } = useClientContracts(user.id);

const getInitials = (name: string) => {
return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const safeFormatDate = (dateString: string | undefined | null, pattern: string) => {
if (!dateString) return '-';
try {
const date = new Date(dateString);
if (isNaN(date.getTime())) return '-';
return format(date, pattern, { locale: ptBR });
} catch (error) {
return '-';
}
};

const formatPrice = (value: number | undefined) => {
if (!value) return '-';
return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getStatusBadge = (status: string) => {
switch (status) {
case 'Active':
return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Ativo</span>;
case 'Expired':
return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Expirado</span>;
case 'Cancelled':
return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Cancelado</span>;
default:
return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">{status}</span>;
}
};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {getInitials(user.Name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2 text-xl">
                {user.Name}
                <RoleBadge role={user.Role} />
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {user.Email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-6 space-y-6">
            {/* Informações básicas */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Informações
              </h4>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Membro desde</span>
                  <span className="text-sm font-medium text-foreground">
                    {safeFormatDate(user.CreatedAt, "dd 'de' MMMM 'de' yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Contratos Ativos - apenas para clientes */}
            {user.Role === 'Client' && (
<>
<div>
<div className="mb-3">
<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
<Package className="h-4 w-4" />
Contratos Ativos
</h4>
</div>

{isLoadingContracts ? (
<div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
<Loader2 className="h-4 w-4 animate-spin" />
Carregando contratos...
</div>
) : contracts.length === 0 ? (
<div className="p-4 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground text-center">
Nenhum contrato atribuído
</div>
) : (
<div className="space-y-3">
{contracts.map((contract) => (
<div
key={contract.id}
className="p-4 rounded-lg bg-muted/30 border border-border space-y-2"
>
<div className="flex items-center justify-between">
<span className="font-medium text-foreground">{contract.snapshotOfferName || 'Oferta'}</span>
{getStatusBadge(contract.status)}
</div>
<div className="grid grid-cols-2 gap-2 text-sm">
<div>
<span className="text-muted-foreground">Preço:</span>{' '}
<span className="font-medium">{formatPrice(contract.snapshotPrice)}</span>
</div>
<div>
<span className="text-muted-foreground">Vídeos:</span>{' '}
<span className="font-medium">{contract.snapshotVideoQuantity || '-'}</span>
</div>
<div>
<span className="text-muted-foreground">Validade:</span>{' '}
<span className="font-medium">{safeFormatDate(contract.expiresAt, 'dd/MM/yyyy')}</span>
</div>
<div>
<span className="text-muted-foreground">Status:</span>{' '}
<span className="font-medium">{contract.status}</span>
</div>
</div>
</div>
))}
</div>
)}
</div>

{/* Saldos e Serviços */}
<div className="mt-6">
<div className="mb-3">
<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
<Clock className="h-4 w-4" />
Saldos e Serviços
</h4>
</div>

<ServiceBalanceList clientId={user.id} className="grid-cols-1" variant="list" />
</div>
</>
)}
          </div>
        </ScrollArea>

        <Separator />

        <SheetFooter className="pt-4 gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(user)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          {user.Role === 'Client' && (
            <Button
              variant="premium"
              className="flex-1"
              onClick={() => onAssignContract(user)}
            >
              <Package className="h-4 w-4 mr-2" />
              Atribuir
            </Button>
          )}
        <Button
          variant="destructive"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(user.id);
          }}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);
};

export default UserDetailsSheet;
