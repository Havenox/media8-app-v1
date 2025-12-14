import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Trash2,
  Edit,
  AlertTriangle
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
import { useInfiniteUsers, useCreateUser, useDeleteUser, useUpdateUser, useUserStats } from '@/hooks/useUsers';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';
import { useDebounce } from '@/hooks/useDebounce';

// usePackages removed
import { useAssignPackage } from '@/hooks/usePackageAssignments';
import { PackageSelect } from '@/components/packages/PackageSelect';
import { toast } from 'sonner';

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  
  // Modals state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Selection state
  const [selectedClient, setSelectedClient] = useState<UserType | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserType | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserType | null>(null);

  // Forms state
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Client' as UserRole });
  const [editUser, setEditUser] = useState({ name: '', email: '', role: 'Client' as UserRole, phone: '' });

  // Infinite Scroll Hook
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isLoadingUsers 
  } = useInfiniteUsers(roleFilter === 'all' ? undefined : roleFilter, 20, debouncedSearch);

  // Flatten users from pages
  const users = useMemo(() => {
    return data?.pages.flatMap(page => page) ?? [];
  }, [data]);

  // Packages hook removed (lazy loaded in Component)
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();
  const assignPackageMutation = useAssignPackage();


  // Filter users in memory (Search only) - Ideally this should be backend search
  // Filter users - Now handled by backend via useInfiniteUsers and debouncedSearch
  const filteredUsers = users;

  // Fetch stats from backend
  const { data: statsData, isLoading: isLoadingStats } = useUserStats();

  const stats = useMemo(() => ({
    total: statsData?.totalUsers ?? '-',
    admins: statsData?.totalAdmins ?? '-',
    clients: statsData?.totalClients ?? '-',
    editors: statsData?.totalEditors ?? '-',
  }), [statsData]);

  // Handlers
  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    try {
      await createUserMutation.mutateAsync({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        password: newUser.password // Now supported by frontend service
      });
      setIsCreateDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'Client' });
    } catch (error) {
      // Error handled in hook
    }
  };

  const openEditDialog = (user: UserType) => {
    setSelectedUserForEdit(user);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUserForEdit) return;

    // Role change warning
    if (selectedUserForEdit.role !== editUser.role) {
      const confirmChange = window.confirm(`ATENÇÃO: Você está alterando o privilégio de ${selectedUserForEdit.role} para ${editUser.role}. Tem certeza?`);
      if (!confirmChange) return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: selectedUserForEdit.id,
        data: {
          name: editUser.name,
          role: editUser.role,
          phone: editUser.phone
          // Email update might be restricted by backend logic for safety
        }
      });
      setIsEditDialogOpen(false);
      setSelectedUserForEdit(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Esta ação está temporariamente desabilitada pelo sistema.")) return;
    /* 
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) { ... } 
    */
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
      // Error handled in hook
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

  // Loading skeleton
  if (isLoadingUsers && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-20 w-full" />))}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {/* ... Stats cards content (Same as before, simplified for brevity in this replace) ... */}
         <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded bg-primary/10"><User className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total</p></div></CardContent></Card>
         <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded bg-wine-vibrant/10"><Shield className="h-5 w-5 text-wine-vibrant" /></div><div><p className="text-2xl font-bold">{stats.admins}</p><p className="text-sm text-muted-foreground">Admins</p></div></CardContent></Card>
         <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded bg-info/10"><User className="h-5 w-5 text-info" /></div><div><p className="text-2xl font-bold">{stats.clients}</p><p className="text-sm text-muted-foreground">Clientes</p></div></CardContent></Card>
         <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded bg-success/10"><User className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold">{stats.editors}</p><p className="text-sm text-muted-foreground">Editores</p></div></CardContent></Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
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
                Adicione um novo usuário à plataforma. Senha será exigida.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome</Label>
                <Input id="create-name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input id="create-email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-pass">Senha Provisória</Label>
                <Input id="create-pass" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">Função</Label>
                <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client">Cliente</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button variant="premium" onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Gerencie os usuários. Role para carregar mais.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Users List */}
            <InfiniteScroll
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              isLoading={isFetchingNextPage}
              endMessage={
                filteredUsers.length > 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground w-full">
                    Todos os usuários carregados.
                  </div>
                )
              }
            >
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
                          {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
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
                          
                          {/* Optimized Active Package Display */}
                          {user.role === 'Client' && (
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {user.activePackage ? (
                                <span className="text-success">
                                  {user.activePackage.name} • {user.activePackage.videoQuantity} vídeos
                                  {user.activePackage.additionalPackagesCount > 0 && (
                                    <span className="ml-1 text-xs bg-primary/10 px-1 rounded">
                                      +{user.activePackage.additionalPackagesCount}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">Sem pacote ativo</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredUsers.length === 0 && !isLoadingUsers && (
                  <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</div>
                )}
              </div>
            </InfiniteScroll>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editUser.name} onChange={(e) => setEditUser({...editUser, name: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editUser.phone} onChange={(e) => setEditUser({...editUser, phone: e.target.value})} placeholder="+55..." />
             </div>
             <div className="space-y-2">
                <Label>Função (Role)</Label>
                <Select value={editUser.role} onValueChange={(val: UserRole) => setEditUser({...editUser, role: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client">Cliente</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {selectedUserForEdit?.role !== editUser.role && (
                  <div className="flex items-center gap-2 text-amber-500 text-sm mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Alterar a função requer confirmação.</span>
                  </div>
                )}
             </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
             <Button variant="premium" onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
               {updateUserMutation.isPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Salvar Alterações
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Package Dialog (Reused logic) */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        {/* ... Reuse existing dialog content logic matching previous file ... */}
        <DialogContent>
          <DialogHeader><DialogTitle>Atribuir Pacote</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
             <Label>Pacote</Label>
             <PackageSelect 
                value={selectedPackageId} 
                onChange={setSelectedPackageId}
                placeholder="Busque um pacote por nome..." 
             />
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancelar</Button>
             <Button variant="premium" onClick={handleAssignPackage} disabled={!selectedPackageId}>Atribuir</Button>
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
          openEditDialog(user);
        }}
        onAssignPackage={(user) => {
          setSelectedUserForDetails(null);
          openAssignDialog(user);
        }}
        onDelete={handleDeleteUser}
        isDeleting={false} // Disabled
      />
    </motion.div>
  );
};

export default UsersPage;
