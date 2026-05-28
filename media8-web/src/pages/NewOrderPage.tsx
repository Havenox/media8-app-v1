import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Palette,
  Film,
  FileText,
  Link as LinkIcon,
  Plus,
  Check,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { BrandingProfileForm } from '@/components/profiles/BrandingProfileForm';
import { EditingProfileForm } from '@/components/profiles/EditingProfileForm';
import {
  useBrandingProfiles,
  useCreateBrandingProfile,
  useEditingProfiles,
  useCreateEditingProfile,
} from '@/hooks/useBrandingProfiles';
import { useAvailableBalances, useCreateOrder } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { CreateBrandingProfileRequest } from '@/types/brandingProfiles';
import { CreateEditingProfileRequest } from '@/types/brandingProfiles';

// Schema do formulário
const orderSchema = z.object({
  serviceBalanceLotId: z.string().min(1, 'Selecione um lote de saldo'),
  brandingProfileId: z.string().min(1, 'Selecione um perfil de branding'),
  editingProfileId: z.string().min(1, 'Selecione um perfil de edição'),
  title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
  briefing: z.string().min(20, 'Briefing deve ter no mínimo 20 caracteres'),
  sourceFilesUrl: z.string().url('URL inválida'),
  deadline: z.string(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

// Estados de cascata
const [step, setStep] = useState(1);
const [selectedLotId, setSelectedLotId] = useState<string | undefined>(undefined);
const [selectedBrandingId, setSelectedBrandingId] = useState<string | undefined>(undefined);
const [selectedEditingId, setSelectedEditingId] = useState<string | undefined>(undefined);

  // Estados das modais
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

  // Hooks
  const { data: availableBalances = [], isLoading: isLoadingBalances } = useAvailableBalances();
  const { data: brandingProfiles = [] } = useBrandingProfiles(true);
  const { data: editingProfiles = [] } = useEditingProfiles(true);
  const createBrandingMutation = useCreateBrandingProfile();
  const createEditingMutation = useCreateEditingProfile();
  const createOrderMutation = useCreateOrder();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  });

  // Passo 1: Seleção de saldo
  const handleLotSelect = (lotId: string) => {
    setSelectedLotId(lotId);
    setValue('serviceBalanceLotId', lotId);
    setStep(2);
  };

  // Passo 2: Seleção de branding
  const handleBrandingSelect = (value: string) => {
    if (value === '+new') {
      setIsBrandingModalOpen(true);
      return;
    }
    setSelectedBrandingId(value);
    setValue('brandingProfileId', value);
    setStep(3);
  };

  // Passo 3: Seleção de edição
  const handleEditingSelect = (value: string) => {
    if (value === '+new') {
      setIsEditingModalOpen(true);
      return;
    }
    setSelectedEditingId(value);
    setValue('editingProfileId', value);
    setStep(4);
  };

  // Callbacks das modais
  const handleSaveBranding = (data: CreateBrandingProfileRequest) => {
    createBrandingMutation.mutate(data, {
      onSuccess: (newProfile) => {
        setIsBrandingModalOpen(false);
        setSelectedBrandingId(newProfile.id);
        setValue('brandingProfileId', newProfile.id);
        setStep(3);
        toast.success('Perfil de branding criado com sucesso!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar perfil');
      },
    });
  };

  const handleSaveEditing = (data: CreateEditingProfileRequest) => {
    createEditingMutation.mutate(data, {
      onSuccess: (newProfile) => {
        setIsEditingModalOpen(false);
        setSelectedEditingId(newProfile.id);
        setValue('editingProfileId', newProfile.id);
        setStep(4);
        toast.success('Perfil de edição criado com sucesso!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar perfil');
      },
    });
  };

  // Submissão final
  const onSubmit = async (data: OrderFormData) => {
    createOrderMutation.mutate(
      {
        Title: data.title,
        Briefing: data.briefing,
        SourceFilesUrl: data.sourceFilesUrl,
        Deadline: data.deadline,
        ServiceBalanceLotId: data.serviceBalanceLotId,
        BrandingProfileId: data.brandingProfileId,
        EditingProfileId: data.editingProfileId,
      },
      {
        onSuccess: () => {
          toast.success('Pedido criado com sucesso!');
          navigate('/orders');
        },
        onError: (error) => {
          toast.error(error.message || 'Erro ao criar pedido');
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/orders')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Novo Pedido
        </h1>
        <p className="text-muted-foreground mt-1">
          Preencha as informações do seu pedido em cascata
        </p>
      </motion.div>

      {/* Passo 1: Seleção de Saldo */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </span>
            Selecione o Lote de Saldo
          </CardTitle>
          <CardDescription>
            Escolha o contrato que financiará este pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedLotId}
            onValueChange={handleLotSelect}
            disabled={step !== 1}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um lote de saldo" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingBalances ? (
                <SelectItem value="loading" disabled>
                  Carregando...
                </SelectItem>
              ) : availableBalances.length > 0 ? (
                availableBalances.map((lot) => (
                  <SelectItem key={lot.id} value={lot.id}>
                    {lot.SnapshotOfferName || 'Contrato'} - {lot.RemainingQuantity} vídeos
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  Nenhum lote disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Passo 2: Perfil de Branding */}
      <Card className={`mb-6 ${step < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </span>
            Perfil de Branding
          </CardTitle>
          <CardDescription>
            Selecione ou crie um perfil de marca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedBrandingId}
            onValueChange={handleBrandingSelect}
            disabled={step < 2}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um perfil de branding" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+new" className="text-primary font-medium">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Perfil de Branding
                </div>
              </SelectItem>
              {brandingProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Passo 3: Perfil de Edição */}
      <Card className={`mb-6 ${step < 3 ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              3
            </span>
            Perfil de Edição
          </CardTitle>
          <CardDescription>
            Selecione ou crie um estilo de edição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedEditingId}
            onValueChange={handleEditingSelect}
            disabled={step < 3}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um perfil de edição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+new" className="text-primary font-medium">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Perfil de Edição
                </div>
              </SelectItem>
              {editingProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Passo 4: Dados do Vídeo */}
      <Card className={`mb-6 ${step < 4 ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              4
            </span>
            Dados do Vídeo
          </CardTitle>
          <CardDescription>
            Preencha as informações específicas deste pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Projeto</Label>
              <Input
                id="title"
                placeholder="Ex: Reels #001 - Janeiro"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="briefing">Briefing Detalhado</Label>
              <Textarea
                id="briefing"
                placeholder="Ex: Remover pausas entre 01:10 e 01:25, manter introdução..."
                rows={4}
                {...register('briefing')}
              />
              {errors.briefing && (
                <p className="text-sm text-destructive">{errors.briefing.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceFilesUrl">Link dos Arquivos</Label>
              <Input
                id="sourceFilesUrl"
                placeholder="Ex: https://drive.google.com/..."
                {...register('sourceFilesUrl')}
              />
              {errors.sourceFilesUrl && (
                <p className="text-sm text-destructive">{errors.sourceFilesUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo de Entrega</Label>
              <Input
                id="deadline"
                type="date"
                {...register('deadline')}
              />
              {errors.deadline && (
                <p className="text-sm text-destructive">{errors.deadline.message}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/orders')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || step < 4}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Criar Pedido
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modais de Criação de Perfis */}
      <BrandingProfileForm
        open={isBrandingModalOpen}
        onOpenChange={setIsBrandingModalOpen}
        onSave={handleSaveBranding}
        isPending={createBrandingMutation.isPending}
      />

      <EditingProfileForm
        open={isEditingModalOpen}
        onOpenChange={setIsEditingModalOpen}
        onSave={handleSaveEditing}
        isPending={createEditingMutation.isPending}
      />
    </div>
  );
};

export default NewOrderPage;
