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
import { useClientAssignments } from '@/hooks/usePackageAssignments';
import { usePackages } from '@/hooks/usePackages';

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
  const { data: assignments = [], isLoading: assignmentsLoading } = useClientAssignments(
    user?.role === 'Client' ? user?.id : undefined
  );
  const { data: packages = [], isLoading: packagesLoading } = usePackages();

  if (!user) return null;

  const activeAssignments = assignments.filter(a => a.status === 'active');
  
  // Sort by expiration date (soonest first), assignments without expiry go last
  const sortedAssignments = [...activeAssignments].sort((a, b) => {
    if (!a.expiresAt && !b.expiresAt) return 0;
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isExpiringSoon = (expiresAt: string | undefined) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = differenceInDays(new Date(expiresAt), new Date());
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  const getDaysUntilExpiry = (expiresAt: string | undefined) => {
    if (!expiresAt) return Infinity;
    return differenceInDays(new Date(expiresAt), new Date());
  };

  const hasExpiry = (expiresAt: string | undefined): expiresAt is string => {
    return !!expiresAt;
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
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Pacotes Ativos ({activeAssignments.length})
                </h4>

                {assignmentsLoading || packagesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : sortedAssignments.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-border text-center">
                    <Package className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum pacote ativo
                    </p>
                    <Button 
                      variant="link" 
                      className="mt-2 h-auto p-0 text-primary"
                      onClick={() => onAssignPackage(user)}
                    >
                      Atribuir um pacote
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedAssignments.map(assignment => {
                      const pkg = packages.find(p => p.id === assignment.packageId);
                      if (!pkg) return null;

                      const expiringSoon = isExpiringSoon(assignment.expiresAt);
                      const daysLeft = getDaysUntilExpiry(assignment.expiresAt);
                      const isExpired = hasExpiry(assignment.expiresAt) && daysLeft < 0;
                      const showExpiryWarning = hasExpiry(assignment.expiresAt) && (expiringSoon || isExpired);

                      return (
                        <div 
                          key={assignment.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            isExpired 
                              ? 'bg-destructive/5 border-destructive/30' 
                              : expiringSoon 
                                ? 'bg-warning/5 border-warning/30' 
                                : 'bg-muted/30 border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-foreground">{pkg.name}</h5>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {pkg.videoQuantity} vídeos
                              </p>
                            </div>
                            {showExpiryWarning && (
                              <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${
                                isExpired ? 'text-destructive' : 'text-warning'
                              }`} />
                            )}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Ativado em
                              </span>
                              <span className="text-foreground">
                                {safeFormatDate(assignment.assignedAt, 'dd/MM/yyyy')}
                              </span>
                            </div>
                            {hasExpiry(assignment.expiresAt) ? (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {isExpired ? 'Expirou em' : 'Expira em'}
                                </span>
                                <span className={`font-medium ${
                                  isExpired 
                                    ? 'text-destructive' 
                                    : expiringSoon 
                                      ? 'text-warning' 
                                      : 'text-foreground'
                                }`}>
                                  {safeFormatDate(assignment.expiresAt, 'dd/MM/yyyy')}
                                  {expiringSoon && !isExpired && (
                                    <span className="ml-1 text-xs">
                                      ({daysLeft} {daysLeft === 1 ? 'dia' : 'dias'})
                                    </span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Validade
                                </span>
                                <span className="text-success font-medium">
                                  Sem expiração
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
