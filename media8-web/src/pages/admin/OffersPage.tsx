import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  Loader2,
  Tag,
  Clock,
  DollarSign,
  Video,
  Calendar,
  Star,
  X,
} from 'lucide-react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useAuth } from '@/contexts/AuthContext';
import { useVideoFormats } from '@/hooks/useVideoFormats';

// Novos hooks - Offers
import {
  useOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
} from '@/hooks/useOffers';

// Tipos
import { Offer, ContractType, CreateOfferRequest, UpdateOfferRequest } from '@/types/offers';

interface NewOfferState {
  name: string;
  slug: string;
  contractType: ContractType;
  price: number;
  videoQuantity: number;
  maxDurationSeconds: number;
  validityDays: number;
  loyaltyMonths: number;
  deliveryDays: number;
  description: string;
  features: string[];
  disclaimer: string;
  badge: string;
  isPublic: boolean;
}

const initialOfferState: NewOfferState = {
  name: '',
  slug: '',
  contractType: 'Avulso',
  price: 0,
  videoQuantity: 1,
  maxDurationSeconds: 180,
  validityDays: 30,
  loyaltyMonths: 0,
  deliveryDays: 7,
  description: '',
  features: [''],
  disclaimer: '',
  badge: '',
  isPublic: true,
};

const OffersPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Video Formats
  const { data: videoFormats = [], isLoading: isLoadingFormats } = useVideoFormats();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ContractType | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newOffer, setNewOffer] = useState<NewOfferState>(initialOfferState);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  // Hooks
  const { data: offers = [], isLoading: isLoadingOffers } = useOffers();
  const createOfferMutation = useCreateOffer();
  const updateOfferMutation = useUpdateOffer();
  const deleteOfferMutation = useDeleteOffer();

  // Filter offers
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesSearch = offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || offer.contractType === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [offers, searchTerm, categoryFilter]);

  // Feature list management
  const addFeature = () => {
    setNewOffer({
      ...newOffer,
      features: [...newOffer.features, ''],
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = newOffer.features.filter((_, i) => i !== index);
    setNewOffer({ ...newOffer, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...newOffer.features];
    newFeatures[index] = value;
    setNewOffer({ ...newOffer, features: newFeatures });
  };

  const handleEditOffer = (offer: Offer) => {
    setNewOffer({
      name: offer.name,
      slug: offer.slug,
      contractType: offer.contractType,
      price: offer.price,
      videoQuantity: offer.videoQuantity,
      maxDurationSeconds: offer.maxDurationSeconds,
      validityDays: offer.validityDays || 0,
      loyaltyMonths: offer.loyaltyMonths,
      deliveryDays: offer.deliveryDays,
      description: offer.description || '',
      features: offer.features,
      disclaimer: offer.disclaimer || '',
      badge: offer.badge || '',
      isPublic: offer.isPublic,
    });
    setSelectedOffer(offer);
    setIsDialogOpen(true);
  };

  const handleCreateOffer = async () => {
    // Validation
    if (!newOffer.name.trim()) {
      toast.error('O nome da oferta é obrigatório');
      return;
    }
    if (!newOffer.slug.trim()) {
      toast.error('O slug é obrigatório');
      return;
    }
    if (newOffer.price <= 0) {
      toast.error('O preço deve ser maior que zero');
      return;
    }
    if (newOffer.videoQuantity < 1) {
      toast.error('A quantidade de vídeos deve ser pelo menos 1');
      return;
    }
    if (newOffer.maxDurationSeconds < 15) {
      toast.error('A duração máxima deve ser pelo menos 15 segundos');
      return;
    }

    const offerData: CreateOfferRequest = {
      name: newOffer.name,
      slug: newOffer.slug,
      contractType: newOffer.contractType,
      price: newOffer.price,
      videoQuantity: newOffer.videoQuantity,
      maxDurationSeconds: newOffer.maxDurationSeconds,
      validityDays: newOffer.validityDays || undefined,
      loyaltyMonths: newOffer.loyaltyMonths,
      deliveryDays: newOffer.deliveryDays,
      description: newOffer.description || undefined,
      features: newOffer.features.filter((f) => f.trim()),
      disclaimer: newOffer.disclaimer || undefined,
      badge: newOffer.badge || undefined,
      isPublic: newOffer.isPublic,
    };

    if (selectedOffer) {
      updateOfferMutation.mutate({ id: selectedOffer.id, data: offerData });
    } else {
      createOfferMutation.mutate(offerData);
    }

    setIsDialogOpen(false);
    setSelectedOffer(null);
    setNewOffer(initialOfferState);
  };

  const handleDeleteOffer = () => {
    if (offerToDelete) {
      deleteOfferMutation.mutate(offerToDelete.id);
      setIsDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
  };

  const openCreateDialog = () => {
    setNewOffer(initialOfferState);
    setSelectedOffer(null);
    setIsDialogOpen(true);
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 3600) {
      return `${(seconds / 3600).toFixed(1)}h`;
    }
    if (seconds >= 60) {
      return `${(seconds / 60).toFixed(0)}min`;
    }
    return `${seconds}s`;
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getContractTypeColor = (type: ContractType) => {
    switch (type) {
      case 'Avulso':
        return 'bg-blue-100 text-blue-800';
      case 'Pacote':
        return 'bg-purple-100 text-purple-800';
      case 'Assinatura':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Catálogo de Ofertas</h1>
          <p className="text-muted-foreground">
            Gerencie as ofertas comerciais e pacotes de edição de vídeo
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Oferta
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value: any) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="Avulso">Avulso</SelectItem>
                <SelectItem value="Pacote">Pacote</SelectItem>
                <SelectItem value="Assinatura">Assinatura</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingOffers ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : filteredOffers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma oferta encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredOffers.map((offer) => (
            <Card key={offer.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {offer.name}
                      {offer.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {offer.badge}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {offer.slug}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`${getContractTypeColor(offer.contractType)} border-0`}
                  >
                    {offer.contractType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">{formatPrice(offer.price)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4 text-blue-600" />
                    <span>{offer.videoQuantity} vídeos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>Duração: {formatDuration(offer.maxDurationSeconds)}</span>
                  </div>
                  {offer.validityDays && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>Validade: {offer.validityDays} dias</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-pink-600" />
                    <span>Fidelidade: {offer.loyaltyMonths} meses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span>Entrega: {offer.deliveryDays} dias</span>
                  </div>
                  {offer.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {offer.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditOffer(offer)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setOfferToDelete(offer);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOffer ? 'Editar Oferta' : 'Nova Oferta'}
            </DialogTitle>
            <DialogDescription>
              {selectedOffer
                ? 'Edite os detalhes da oferta comercial'
                : 'Crie uma nova oferta para o catálogo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome e Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={newOffer.name}
                  onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                  placeholder="Ex: Plano Mensal"
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input
                  value={newOffer.slug}
                  onChange={(e) =>
                    setNewOffer({
                      ...newOffer,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  placeholder="plano-mensal"
                />
              </div>
            </div>

            {/* Tipo de Contrato */}
            <div>
              <Label>Tipo de Contrato *</Label>
              <Select
                value={newOffer.contractType}
                onValueChange={(value: any) =>
                  setNewOffer({ ...newOffer, contractType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Avulso">Avulso</SelectItem>
                  <SelectItem value="Pacote">Pacote</SelectItem>
                  <SelectItem value="Assinatura">Assinatura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preço e Quantidade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  value={newOffer.price}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label>Quantidade de Vídeos *</Label>
                <Input
                  type="number"
                  value={newOffer.videoQuantity}
                  onChange={(e) =>
                    setNewOffer({
                      ...newOffer,
                      videoQuantity: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            {/* Duração e Validade */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Duração Máx (seg) *</Label>
                <Input
                  type="number"
                  value={newOffer.maxDurationSeconds}
                  onChange={(e) =>
                    setNewOffer({
                      ...newOffer,
                      maxDurationSeconds: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Validade (dias)</Label>
                <Input
                  type="number"
                  value={newOffer.validityDays}
                  onChange={(e) =>
                    setNewOffer({
                      ...newOffer,
                      validityDays: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Prazo de Entrega (dias)</Label>
                <Input
                  type="number"
                  value={newOffer.deliveryDays}
                  onChange={(e) =>
                    setNewOffer({
                      ...newOffer,
                      deliveryDays: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* Fidelidade */}
            <div>
              <Label>Fidelidade (meses)</Label>
              <Input
                type="number"
                value={newOffer.loyaltyMonths}
                onChange={(e) =>
                  setNewOffer({
                    ...newOffer,
                    loyaltyMonths: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* Descrição */}
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={newOffer.description}
                onChange={(e) =>
                  setNewOffer({ ...newOffer, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Recursos */}
            <div>
              <Label>Características</Label>
              {newOffer.features.map((feature, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Ex: Revisões ilimitadas"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeFeature(index)}
                    disabled={newOffer.features.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addFeature} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar característica
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOffer}>
              {selectedOffer ? 'Salvar Alterações' : 'Criar Oferta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Oferta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta oferta? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteOffer}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OffersPage;
