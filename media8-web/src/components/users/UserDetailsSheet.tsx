import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Edit, 
  Trash2, 
  Package, 
  Calendar, 
  AlertTriangle,
  Mail,
  Clock,
  Loader2
} from 'lucide-react';

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

interface UserDetailsSheetProps {
  user: UserType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (user: UserType) => void;
  onAssignPackage: (user: UserType) => void;
  onDelete: (userId: string) => void;
  isDeleting?: boolean;
}

const UserDetailsSheet: React.FC<UserDetailsSheetProps> = ({
  user,
  open,
  onOpenChange,
  onEdit,
  onAssignPackage,
  onDelete,
  isDeleting = false,
}) => {
  if (!user) return null;

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2 text-xl">
                {user.name}
                <RoleBadge role={user.role} />
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
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
                    {safeFormatDate(user.createdAt, "dd 'de' MMMM 'de' yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Pacotes ativos - apenas para clientes */}
            {user.role === 'Client' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Saldos e Serviços
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => onAssignPackage(user)}
                  >
                    + Atribuir
                  </Button>
                </div>

                <ServiceBalanceList clientId={user.id} className="grid-cols-1" variant="list" />
              </div>
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
          {user.role === 'Client' && (
            <Button 
              variant="premium" 
              className="flex-1"
              onClick={() => onAssignPackage(user)}
            >
              <Package className="h-4 w-4 mr-2" />
              Atribuir
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="icon"
            onClick={() => onDelete(user.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default UserDetailsSheet;
