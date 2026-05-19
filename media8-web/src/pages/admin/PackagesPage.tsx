import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  X,
  Clock,
  Star,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package as PackageType, PackageCategory, CreatePackageRequest } from '@/types/packages';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoFormats } from '@/hooks/useVideoFormats';

// Hooks
import { usePackages, useCreatePackage, useUpdatePackage, useTogglePackageStatus, useDeletePackage } from '@/hooks/usePackages';
// useClients removed
import { useAssignPackage } from '@/hooks/usePackageAssignments';
import { DeletePackageDialog } from '@/components/packages/DeletePackageDialog';
import { UserSelect } from '@/components/users/UserSelect';

interface NewPackageState {
  name: string;
  category: PackageCategory;
  price: number;
  videoQuantity: number;
  maxDurationSeconds: number;
  uiDurationUnit: 'min' | 'sec';
  validityDays: number;
  loyaltyMonths: number;
  deliveryDays: number;
  description: string;
  features: string[];
  disclaimer: string;
  badge: string;
  isPublic: boolean;
}

const initialPackageState: NewPackageState = {
  name: '',
  category: 'pacote',
  price: 0,
  videoQuantity: 1,
  maxDurationSeconds: 60,
  uiDurationUnit: 'sec',
  validityDays: 30,
  loyaltyMonths: 0,
  deliveryDays: 7,
  description: '',
  features: [''],
  disclaimer: '',
  badge: '',
  isPublic: true,
};

const PackagesPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Video Formats (Fase 0)
  const { data: videoFormats = [], isLoading: isLoadingFormats } = useVideoFormats();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PackageCategory | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPackage, setNewPackage] = useState<NewPackageState>(initialPackageState);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<PackageType | null>(null);

  // Hooks
  const { data: packages = [], isLoading: isLoadingPackages } = usePackages();
  // useClients removed - UserSelect manages its own data
  const createPackageMutation = useCreatePackage();
  const updatePackageMutation = useUpdatePackage();
  const toggleVisibilityMutation = useTogglePackageStatus();
  const deletePackageMutation = useDeletePackage();
  const assignPackageMutation = useAssignPackage();

  // Filter packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || pkg.category.toLowerCase() === categoryFilter.toLowerCase();
      // Removed status filter since IsActive is gone. We could filter by Public/Private if requested, but for now just removing the broken logic.
      return matchesSearch && matchesCategory;
    });
  }, [packages, searchQuery, categoryFilter, statusFilter]);

  // Feature list management
  const addFeature = () => {
    setNewPackage({
      ...newPackage,
      features: [...newPackage.features, ''],
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = newPackage.features.filter((_, i) => i !== index);
    setNewPackage({ ...newPackage, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...newPackage.features];
    newFeatures[index] = value;
    setNewPackage({ ...newPackage, features: newFeatures });
  };

  const handleEditPackage = (pkg: PackageType) => {
    setNewPackage({
      name: pkg.name,
      category: pkg.category as PackageCategory, // Ensure type safety if needed
      price: pkg.price,
      videoQuantity: pkg.videoQuantity,
      maxDurationSeconds: pkg.maxDurationSeconds,
      uiDurationUnit: pkg.maxDurationSeconds % 60 === 0 ? 'min' : 'sec',
      validityDays: pkg.validityDays || 0,
      loyaltyMonths: pkg.loyaltyMonths,
      deliveryDays: pkg.deliveryDays,
      description: pkg.description || '',
      features: pkg.features,
      disclaimer: pkg.disclaimer || '',
      badge: pkg.badge || '',
      isPublic: pkg.isPublic,
    });
    setSelectedPackage(pkg);
    setIsCreateDialogOpen(true);
  };

  const handleCreatePackage = async () => {
    // Validation
    if (!newPackage.name.trim()) {
      toast.error('O nome do pacote é obrigatório');
      return;
    }
    if (newPackage.price <= 0) {
      toast.error('O preço deve ser maior que zero');
      return;
    }
    if (newPackage.videoQuantity < 1) {
      toast.error('A quantidade de vídeos deve ser pelo menos 1');
      return;
    }
    if (newPackage.maxDurationSeconds < 15) {
      toast.error('A duração máxima deve ser pelo menos 15 segundos');
      return;
    }
    if (newPackage.deliveryDays < 0) {
      toast.error('O prazo de entrega não pode ser negativo');
      return;
    }

    const createData: CreatePackageRequest = {
      name: newPackage.name.trim(),
      category: newPackage.category,
      price: newPackage.price,
      videoQuantity: newPackage.videoQuantity,
      maxDurationSeconds: newPackage.maxDurationSeconds,
      validityDays: newPackage.validityDays > 0 ? newPackage.validityDays : null,
      loyaltyMonths: newPackage.loyaltyMonths,
      deliveryDays: newPackage.deliveryDays,
      serviceTypes: ['ReelsStandard'], // LEGACY - will be removed in next step
      supportedFormatsIds: videoFormats.map(vf => vf.id), // Fase 0: Dynamic catalog
      description: newPackage.description,
      features: newPackage.features.filter(f => f.trim().length > 0),
      disclaimer: newPackage.disclaimer || undefined,
      badge: newPackage.badge || undefined,
      isPublic: newPackage.isPublic,
    };

    try {
      if (selectedPackage) {
        await updatePackageMutation.mutateAsync({
          id: selectedPackage.id,
          data: createData,
        });
      } else {
        await createPackageMutation.mutateAsync(createData);
      }
      setIsCreateDialogOpen(false);
      setNewPackage(initialPackageState);
      setSelectedPackage(null);
    } catch (error) {
      // Error handled in hook
      console.error(error);
    }
  };

  const handleToggleVisibility = async (pkgId: string) => {
    try {
      await toggleVisibilityMutation.mutateAsync(pkgId);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteClick = (pkg: PackageType) => {
    setPackageToDelete(pkg);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!packageToDelete) return;
    await deletePackageMutation.mutateAsync(packageToDelete.id);
  };

  const handleAssignPackage = async () => {
    if (!selectedPackage || !selectedClientId || !currentUser) return;

    try {
      await assignPackageMutation.mutateAsync({
        data: {
          packageId: selectedPackage.id,
          clientId: selectedClientId,
        },
        assignedBy: currentUser.id,
      });
      setIsAssignDialogOpen(false);
      setSelectedPackage(null);
      setSelectedClientId('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const openAssignDialog = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setIsAssignDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getCategoryLabel = (category: PackageCategory) => {
    // Backend returns PascalCase (Assinatura), but Type might define lowercase depending on version.
    // We normalize to lowercase for lookup or handle both.
    const normalized = category.toLowerCase() as PackageCategory;
    const labels: Record<string, string> = {
      assinatura: 'Assinatura',
      pacote: 'Pacote',
      avulso: 'Avulso',
    };
    return labels[normalized] || category;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} seg`;
    if (seconds % 60 === 0) return `${seconds / 60} min`;
    const mins = Math.floor(seconds / 60);
    const segs = seconds % 60;
    return `${mins} min ${segs} seg`;
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
  if (isLoadingPackages) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
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
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestão de Pacotes
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie os pacotes disponíveis para clientes.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="premium">
              <Plus className="h-4 w-4" />
              Novo Pacote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedPackage ? 'Editar Pacote' : 'Criar Novo Pacote'}</DialogTitle>
              <DialogDescription>
                {selectedPackage ? 'Edite as informações do pacote existente.' : 'Configure um novo pacote ou plano para clientes.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-2">
              {/* Section: Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Nome do Pacote *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Plano Growth Mensal"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select
                      value={newPackage.category}
                      onValueChange={(v: PackageCategory) => setNewPackage({ ...newPackage, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Assinatura">Assinatura</SelectItem>
                        <SelectItem value="Pacote">Pacote</SelectItem>
                        <SelectItem value="Avulso">Avulso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="badge">Badge (opcional)</Label>
                    <Input
                      id="badge"
                      placeholder="Ex: Mais Vendido, Novo"
                      value={newPackage.badge}
                      onChange={(e) => setNewPackage({ ...newPackage, badge: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Valores e Quantidades */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Valores e Quantidades
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      value={newPackage.price}
                      onChange={(e) => setNewPackage({ ...newPackage, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Qtd. de Vídeos *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={newPackage.videoQuantity}
                      onChange={(e) => setNewPackage({ ...newPackage, videoQuantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDuration">Duração Máx. *</Label>
                    <div className="flex gap-2">
                        <Input
                          id="maxDuration"
                          type="number"
                          min={1}
                          className="flex-1"
                          value={newPackage.uiDurationUnit === 'min' ? newPackage.maxDurationSeconds / 60 : newPackage.maxDurationSeconds}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setNewPackage({ 
                              ...newPackage, 
                              maxDurationSeconds: newPackage.uiDurationUnit === 'min' ? Math.round(val * 60) : val 
                            });
                          }}
                        />
                        <Select
                          value={newPackage.uiDurationUnit}
                          onValueChange={(v: 'min' | 'sec') => setNewPackage({ ...newPackage, uiDurationUnit: v })}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="min">Min</SelectItem>
                            <SelectItem value="sec">Seg</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                  </div>
                </div>
              </div>



              {/* Section: Visibilidade */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Visibilidade e Configurações
                </h3>
                <div className="flex items-center space-x-2 border p-4 rounded-lg">
                  <Switch
                    id="isPublic"
                    checked={newPackage.isPublic}
                    onCheckedChange={(checked) => setNewPackage({ ...newPackage, isPublic: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="isPublic" className="font-medium">Pacote Público</Label>
                    <p className="text-sm text-muted-foreground">
                      Se desativado, o pacote ficará visível apenas para administradores (útil para propostas personalizadas).
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Prazos e Condições */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Prazos e Condições
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validity">Validade (dias)</Label>
                    <Input
                      id="validity"
                      type="number"
                      min={0}
                      placeholder="0 = sem expiração"
                      value={newPackage.validityDays}
                      onChange={(e) => setNewPackage({ ...newPackage, validityDays: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">0 = sem expiração</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loyalty">Fidelidade (meses)</Label>
                    <Input
                      id="loyalty"
                      type="number"
                      min={0}
                      value={newPackage.loyaltyMonths}
                      onChange={(e) => setNewPackage({ ...newPackage, loyaltyMonths: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">0 = sem fidelidade</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery">Prazo de Entrega (dias)</Label>
                    <Input
                      id="delivery"
                      type="number"
                      min={0}
                      value={newPackage.deliveryDays}
                      onChange={(e) => setNewPackage({ ...newPackage, deliveryDays: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">0 = à combinar</p>
                  </div>
                </div>
              </div>

              {/* Section: Conteúdo */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Conteúdo
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição Curta</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva brevemente o pacote..."
                    rows={2}
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disclaimer">Disclaimer</Label>
                  <Input
                    id="disclaimer"
                    placeholder="Ex: Prazo alinhado previamente, Renovação automática"
                    value={newPackage.disclaimer}
                    onChange={(e) => setNewPackage({ ...newPackage, disclaimer: e.target.value })}
                  />
                </div>
              </div>

              {/* Section: Benefícios */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Benefícios
                </h3>
                <div className="space-y-2">
                  {newPackage.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`Benefício ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                        disabled={newPackage.features.length <= 1}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFeature}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Benefício
                  </Button>
                </div>
              </div>

            </div>
            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setSelectedPackage(null);
                setNewPackage(initialPackageState);
              }}>
                Cancelar
              </Button>
              <Button 
                variant="premium" 
                onClick={handleCreatePackage} 
                disabled={!newPackage.name.trim() || newPackage.price <= 0 || createPackageMutation.isPending}
              >
                {createPackageMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedPackage ? 'Salvar Alterações' : 'Criar Pacote'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pacotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="assinatura">Assinatura</SelectItem>
            <SelectItem value="pacote">Pacote</SelectItem>
            <SelectItem value="avulso">Avulso</SelectItem>
          </SelectContent>
        </Select>

      </motion.div>

      {/* Packages List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pacotes ({filteredPackages.length})
            </CardTitle>
            <CardDescription>
              Gerencie os pacotes e planos disponíveis no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPackages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      pkg.isPublic ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Package className={`h-6 w-6 ${pkg.isPublic ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground">{pkg.name}</h4>
                        <Badge variant="outline">
                          {getCategoryLabel(pkg.category)}
                        </Badge>
                        {pkg.badge && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            <Star className="h-3 w-3 mr-1" />
                            {pkg.badge}
                          </Badge>
                        )}
                        {pkg.isHighlighted && (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Destaque
                          </Badge>
                        )}

                        <Badge variant={pkg.isPublic ? 'outline' : 'destructive'} className={pkg.isPublic ? 'border-primary/20 text-muted-foreground' : ''}>
                          {pkg.isPublic ? (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> Público
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <EyeOff className="h-3 w-3" /> Privado
                            </div>
                          )}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{formatPrice(pkg.price)}</span>
                        <span>{pkg.videoQuantity} vídeos</span>
                        <span>até {formatDuration(pkg.maxDurationSeconds)}</span>
                        {pkg.validityDays && <span>{pkg.validityDays} dias</span>}
                        {pkg.loyaltyMonths > 0 && <span>Fidelidade: {pkg.loyaltyMonths} meses</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pkg.deliveryDays > 0 ? `${pkg.deliveryDays} dias` : 'À combinar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ações
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => openAssignDialog(pkg)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Atribuir a Cliente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditPackage(pkg)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleVisibility(pkg.id)}
                        disabled={toggleVisibilityMutation.isPending}
                      >
                        {pkg.isPublic ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Tornar Privado
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Tornar Público
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteClick(pkg)}
                        disabled={deletePackageMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}

              {filteredPackages.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">Nenhum pacote encontrado</h3>
                  <p className="text-muted-foreground text-sm">
                    Crie um novo pacote ou ajuste os filtros.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Pacote a Cliente</DialogTitle>
            <DialogDescription>
              Selecione o cliente que receberá o pacote "{selectedPackage?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <UserSelect 
                role="Client" 
                value={selectedClientId} 
                onChange={setSelectedClientId} 
              />
            </div>
            {selectedPackage && (
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium">{selectedPackage.name}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{selectedPackage.videoQuantity} vídeos • até {formatDuration(selectedPackage.maxDurationSeconds)} cada</p>
                  <p>{formatPrice(selectedPackage.price)}</p>
                  {selectedPackage.validityDays && <p>Validade: {selectedPackage.validityDays} dias</p>}
                  {selectedPackage.deliveryDays > 0 ? (
                    <p>Prazo de entrega: {selectedPackage.deliveryDays} dias</p>
                  ) : (
                    <p>Prazo de entrega: À combinar</p>
                  )}
                </div>
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
              disabled={!selectedClientId || assignPackageMutation.isPending}
            >
              {assignPackageMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Atribuir Pacote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeletePackageDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        packageToDelete={packageToDelete}
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  );
};

export default PackagesPage;
