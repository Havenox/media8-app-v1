import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  User,
  Mail,
  Shield,
  Package,
  UserPlus,
  Filter,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRole, User as UserType } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import UserDetailsSheet from '@/components/users/UserDetailsSheet';

// Hooks
import { useUsers, useCreateUser, useDeleteUser } from '@/hooks/useUsers';
import { usePackages } from '@/hooks/usePackages';
import { useClientAssignments, useAssignPackage } from '@/hooks/usePackageAssignments';

// Component for client package info
const ClientPackageInfo: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { data: assignments = [], isLoading: assignmentsLoading } = useClientAssignments(clientId);
  const { data: packages, isLoading: packagesLoading } = usePackages();
  
  if (assignmentsLoading || packagesLoading) {
    return <span className="text-muted-foreground/60">Carregando...</span>;
  }
  
  // Filter only active assignments
  const activeAssignments = assignments.filter(a => a.status === 'active');
  
  if (activeAssignments.length === 0 || !packages) {
    return <span className="text-muted-foreground/60">Sem pacote ativo</span>;
  }
  
  // Sort by most recent first
  const sortedAssignments = [...activeAssignments].sort(
    (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
  );
  
  // Get the most recent package
  const latestAssignment = sortedAssignments[0];
  const pkg = packages.find(p => p.id === latestAssignment.packageId);
  
  if (!pkg) {
    console.warn(`[ClientPackageInfo] Package not found: ${latestAssignment.packageId}`);
    return <span className="text-muted-foreground/60">Sem pacote ativo</span>;
  }
  
  // Count of additional packages
  const additionalCount = activeAssignments.length - 1;
  
  return (
    <span className="text-success">
      {pkg.name} • {pkg.videoQuantity} vídeos
      {additionalCount > 0 && (
        <span className="ml-1">
          (+{additionalCount} {additionalCount === 1 ? 'pacote' : 'pacotes'})
        </span>
      )}
    </span>
  );
};

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserType | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Client' as UserRole });
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserType | null>(null);

  // Hooks
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const { data: packages = [] } = usePackages();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const assignPackageMutation = useAssignPackage();

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === 'Admin').length,
    clients: users.filter((u) => u.role === 'Client').length,
    editors: users.filter((u) => u.role === 'Editor').length,
  }), [users]);

  // Get active packages (for assignment dropdown)
  const activePackages = useMemo(() => {
    return packages.filter(p => p.isActive);
  }, [packages]);

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    
    try {
      await createUserMutation.mutateAsync({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
      });
      setIsCreateDialogOpen(false);
      setNewUser({ name: '', email: '', role: 'Client' });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleAssignPackage = async () => {
    if (!selectedClient || !selectedPackageId || !currentUser) return;
    
    try {
      await assignPackageMutation.mutateAsync({
        data: {
          packageId: selectedPackageId,
          clientId: selectedClient.id,
        },
        assignedBy: currentUser.id,
      });
      setIsAssignDialogOpen(false);
      setSelectedClient(null);
      setSelectedPackageId('');
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const openAssignDialog = (user: UserType) => {
    setSelectedClient(user);
    setSelectedPackageId('');
    setIsAssignDialogOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Loading skeleton
  if (isLoadingUsers) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-wine-vibrant/10">
                <Shield className="h-5 w-5 text-wine-vibrant" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <User className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.clients}</p>
                <p className="text-sm text-muted-foreground">Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <User className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.editors}</p>
                <p className="text-sm text-muted-foreground">Editores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Header Actions */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Client">Cliente</SelectItem>
              <SelectItem value="Editor">Editor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* New User Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="premium">
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário à plataforma.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client">Cliente</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="premium" 
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending || !newUser.name.trim() || !newUser.email.trim()}
              >
                {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Users List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Gerencie os usuários da plataforma Media 8.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedUserForDetails(user)}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{user.name}</h4>
                        <RoleBadge role={user.role} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.role === 'Client' && (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <ClientPackageInfo clientId={user.id} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">Nenhum usuário encontrado</h3>
                  <p className="text-muted-foreground text-sm">
                    Tente ajustar os filtros de busca.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Assign Package Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Pacote</DialogTitle>
            <DialogDescription>
              Selecione um pacote para atribuir a {selectedClient?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="package">Pacote</Label>
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um pacote..." />
                </SelectTrigger>
                <SelectContent>
                  {activePackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      <div className="flex items-center gap-2">
                        <span>{pkg.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({pkg.videoQuantity} vídeos • R$ {pkg.price})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPackageId && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                {(() => {
                  const pkg = packages.find(p => p.id === selectedPackageId);
                  if (!pkg) return null;
                  return (
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">{pkg.name}</h4>
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {pkg.videoQuantity} vídeos
                        </span>
                        {pkg.validityDays && (
                          <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                            Válido por {pkg.validityDays} dias
                          </span>
                        )}
                        {pkg.loyaltyMonths > 0 && (
                          <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                            Fidelidade {pkg.loyaltyMonths} meses
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="premium" 
              onClick={handleAssignPackage}
              disabled={!selectedPackageId || assignPackageMutation.isPending}
            >
              {assignPackageMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Atribuir Pacote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Sheet */}
      <UserDetailsSheet
        user={selectedUserForDetails}
        open={!!selectedUserForDetails}
        onOpenChange={(open) => !open && setSelectedUserForDetails(null)}
        onEdit={(user) => {
          setSelectedUserForDetails(null);
          // TODO: Implement edit user dialog
        }}
        onAssignPackage={(user) => {
          setSelectedUserForDetails(null);
          openAssignDialog(user);
        }}
        onDelete={(userId) => {
          handleDeleteUser(userId);
          setSelectedUserForDetails(null);
        }}
        isDeleting={deleteUserMutation.isPending}
      />
    </motion.div>
  );
};

export default UsersPage;
