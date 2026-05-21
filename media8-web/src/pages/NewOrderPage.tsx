import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addBusinessDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Video,
  FileText,
  Link as LinkIcon,
  Calendar as CalendarIcon,
  Loader2,
  Sparkles,
  Smartphone,
  Youtube,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getServiceConfig, isDynamicDeadline } from '@/types/services';
import { useAvailableServices } from '@/hooks/useServiceBalances';
import { useCreateOrder, useAvailableBalances } from '@/hooks/useOrders';
import { useVideoFormats } from '@/hooks/useVideoFormats';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Icon mapping for service categories
const categoryIcons: Record<string, React.ElementType> = {
  reels: Smartphone,
  youtube: Youtube,
  pacote: Package,
  avulso: Video,
};

// Helper function to get minimum delivery date based on service type
const getMinDeliveryDate = (serviceType: ServiceType): Date => {
  const today = startOfDay(new Date());
  const config = getServiceConfig(serviceType);
  const minDays = config?.minBusinessDays || 7;
  return addBusinessDays(today, minDays);
};

const orderSchema = z.object({
serviceBalanceLotId: z.string().min(1, 'Selecione um lote de saldo'),
title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
briefing: z.string().min(20, 'Briefing deve ter no mínimo 20 caracteres'),
sourceFilesUrl: z.string().url('URL inválida'),
deadline: z.date().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const NewOrderPage: React.FC = () => {
const navigate = useNavigate();
const [searchParams] = useSearchParams();
const { user } = useAuth();
const [calendarOpen, setCalendarOpen] = useState(false);
const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
const [selectedVideoFormatId, setSelectedVideoFormatId] = useState<string | null>(null);

// Get pre-selected service on load
const preSelectedService = searchParams.get('service');

// Get user's available services using hook
const { data: availableServices = [], isLoading: isLoadingServices } = useAvailableServices(user?.id);
const createOrderMutation = useCreateOrder();
const { data: videoFormats = [], isLoading: isLoadingFormats } = useVideoFormats();
const { data: availableBalances = [], isLoading: isLoadingBalances } = useAvailableBalances();

  // Get selected service config
  const selectedConfig = useMemo(() => {
    if (!selectedServiceType) return null;
    return getServiceConfig(selectedServiceType);
  }, [selectedServiceType]);

  // Check if deadline is dynamic
  const hasDynamicDeadline = useMemo(() => {
    if (!selectedServiceType) return false;
    return isDynamicDeadline(selectedServiceType);
  }, [selectedServiceType]);

  // Calculate minimum delivery date based on selected service
  const minDeliveryDate = useMemo(() => {
    if (!selectedServiceType || hasDynamicDeadline) return null;
    return getMinDeliveryDate(selectedServiceType);
  }, [selectedServiceType, hasDynamicDeadline]);

  // Get selected video format config
  const selectedVideoFormat = useMemo(() => {
    if (!selectedVideoFormatId) return null;
    return videoFormats.find(vf => vf.id === selectedVideoFormatId) || null;
  }, [selectedVideoFormatId, videoFormats]);

const {
register,
handleSubmit,
control,
setValue,
watch,
formState: { errors, isValid, isDirty },
trigger,
} = useForm<OrderFormData>({
resolver: zodResolver(orderSchema),
mode: 'onChange',
});

  const watchedServiceType = watch('serviceType');

  // Pre-select service from URL query param
  useEffect(() => {
    if (preSelectedService && availableServices.length > 0 && !watchedServiceType) {
      // Find matching service in available services
      const matchingService = availableServices.find((balance) => {
        // Priority: snapshot from contract > planName > default
        const snapshotName = balance.lots?.[0]?.contract?.snapshotOfferName || balance.planName;
        const key = `${balance.serviceType}::${snapshotName || 'default'}`;
        return key === preSelectedService;
      });

      if (matchingService) {
        handleServiceTypeChange(preSelectedService);
      }
    }
  }, [preSelectedService, availableServices, watchedServiceType]);
  const handleServiceTypeChange = (value: string) => {
    // Extract serviceType from unique key (format: "serviceType::planName")
    const serviceType = value.split('::')[0] as string;
    setSelectedServiceType(serviceType);
    setValue('serviceType', value);

    // Reset deadline when service type changes
    if (!isDynamicDeadline(serviceType as any)) {
      const newMinDate = getMinDeliveryDate(serviceType as any);
      setValue('deadline', newMinDate);
    } else {
      setValue('deadline', undefined);
    }
  };

  const handleVideoFormatChange = (videoFormatId: string) => {
    setSelectedVideoFormatId(videoFormatId);
    setValue('videoFormatId', videoFormatId);
  };

  // Function to check if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    if (!minDeliveryDate) return true;
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;
    if (isBefore(date, minDeliveryDate)) return true;
    return false;
  };

const onSubmit = async (data: OrderFormData) => {
if (!user?.id) {
toast.error('Usuário não autenticado');
return;
}

try {
const selectedBalance = availableBalances.find(b => b.id === data.serviceBalanceLotId);
if (!selectedBalance || !selectedBalance.videoFormatId) {
toast.error('Saldo selecionado inválido');
return;
}

await createOrderMutation.mutateAsync({
clientId: user.id,
title: data.title,
briefing: data.briefing,
sourceFilesUrl: data.sourceFilesUrl,
deadline: data.deadline?.toISOString() || new Date().toISOString(),
videoFormatId: selectedBalance.videoFormatId,
serviceBalanceLotId: data.serviceBalanceLotId,
});

navigate('/orders');
} catch (error) {
// Error handled in hook
}
};

const handleFormSubmit = async (e: React.FormEvent) => {
e.preventDefault();
const isValidated = await trigger();
if (!isValidated) {
const errorMessages = Object.entries(errors).map(([field, error]) => {
const fieldLabels: Record<string, string> = {
serviceBalanceLotId: 'Saldo disponível',
title: 'Título',
briefing: 'Briefing',
sourceFilesUrl: 'URL dos arquivos',
};
return `${fieldLabels[field] || field}: ${error.message}`;
});
toast.error('Preencha os campos obrigatórios:', {
description: errorMessages.join('\n'),
});
return;
}

// Se validado com sucesso, prossegue com a submissão
handleSubmit(onSubmit)(e);
};

  // Get icon for a service
  const getServiceIcon = (category: string) => {
    const Icon = categoryIcons[category] || Video;
    return <Icon className="h-4 w-4 mr-2" />;
  };

  const isLoading = createOrderMutation.isPending || isLoadingFormats || isLoadingBalances;

const hasEmptyBalance = availableBalances.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto">
          <Video className="h-8 w-8 text-cream" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Novo Pedido de Edição</h1>
        <p className="text-muted-foreground">
          Selecione o serviço e preencha os detalhes do seu projeto.
        </p>
      </div>

{/* Form */}
<Card variant="elevated">
<CardHeader>
<CardTitle className="flex items-center gap-2">
<Sparkles className="h-5 w-5 text-primary" />
Detalhes do Projeto
</CardTitle>
<CardDescription>
Selecione o saldo disponível e preencha os detalhes do seu projeto.
</CardDescription>
</CardHeader>
<CardContent>
<form onSubmit={handleFormSubmit} className="space-y-6">
{/* Service Balance Selection */}
<div className="space-y-2">
<Label className="flex items-center gap-2 text-base font-semibold">
<Package className="h-4 w-4" />
Saldo Disponível
</Label>
<p className="text-sm text-muted-foreground mb-3">
Selecione qual lote de saldo financiará este pedido
</p>
{hasEmptyBalance ? (
<Alert className="border-warning/30 bg-warning/10">
<AlertCircle className="h-4 w-4 text-warning" />
<AlertTitle className="text-warning">Sem saldo disponível</AlertTitle>
<AlertDescription className="text-warning/80">
Você precisa ter pelo menos um saldo disponível para criar um pedido.
</AlertDescription>
</Alert>
) : (
<Controller
control={control}
name="serviceBalanceLotId"
render={({ field }) => (
<Select
value={field.value}
onValueChange={(value) => {
field.onChange(value);
const balance = availableBalances.find(b => b.id === value);
if (balance?.videoFormatId) {
setSelectedVideoFormatId(balance.videoFormatId);
}
}}
>
<SelectTrigger className={cn("w-full h-12", errors.serviceBalanceLotId && "border-destructive")}>
<SelectValue placeholder="Selecione o saldo disponível" />
</SelectTrigger>
<SelectContent>
{availableBalances.map((balance) => (
<SelectItem
key={balance.id}
value={balance.id}
className="py-3"
>
<div className="flex items-center gap-3">
{getServiceIcon('avulso')}
<div className="flex-1">
<div className="font-medium">
{balance.contract?.snapshotOfferName || balance.contract?.offer?.name || 'Saldo de Edição'}
</div>
<div className="text-xs text-muted-foreground">
{balance.remainingQuantity} {balance.remainingQuantity === 1 ? 'unidade' : 'unidades'} disponíveis
{balance.expiresAt && ` • Vence em ${new Date(balance.expiresAt).toLocaleDateString()}`}
</div>
</div>
</div>
</SelectItem>
))}
</SelectContent>
</Select>
)}
/>
)}
{errors.serviceBalanceLotId && (
<p className="text-sm text-destructive flex items-center gap-1">
<AlertCircle className="h-3 w-3" />
{errors.serviceBalanceLotId.message}
</p>
)}
</div>

            {/* Dynamic Deadline Alert */}
            {selectedServiceType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                {hasDynamicDeadline ? (
                  <Alert className="border-info/30 bg-info/10">
                    <AlertCircle className="h-4 w-4 text-info" />
                    <AlertTitle className="text-info">Prazo a Definir</AlertTitle>
                    <AlertDescription className="text-info/80">
                      Este é um projeto complexo. Nossa equipe analisará os arquivos e confirmará 
                      a data de entrega via chat em até 24h após o envio.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-success/30 bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertTitle className="text-success">Prazo Estimado</AlertTitle>
                    <AlertDescription className="text-success/80">
                      Entrega em até {selectedConfig?.minBusinessDays} dias úteis após envio dos arquivos.
                      Você pode selecionar uma data específica abaixo.
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}

{/* Title */}
<div className="space-y-2">
<Label htmlFor="title" className="flex items-center gap-2">
<FileText className="h-4 w-4" />
Título do Projeto
</Label>
<Input
id="title"
placeholder="Ex: Vídeo Institucional - Minha Empresa"
className={cn(errors.title && "border-destructive focus-visible:ring-destructive")}
{...register('title')}
/>
{errors.title && (
<p className="text-sm text-destructive flex items-center gap-1">
<AlertCircle className="h-3 w-3" />
{errors.title.message}
</p>
)}
</div>

{/* Briefing */}
<div className="space-y-2">
<Label htmlFor="briefing" className="flex items-center gap-2">
<FileText className="h-4 w-4" />
Briefing Detalhado
</Label>
<Textarea
id="briefing"
placeholder="Descreva o projeto: objetivo, duração desejada, estilo de edição, referências..."
rows={6}
className={cn(errors.briefing && "border-destructive focus-visible:ring-destructive")}
{...register('briefing')}
/>
{errors.briefing && (
<p className="text-sm text-destructive flex items-center gap-1">
<AlertCircle className="h-3 w-3" />
{errors.briefing.message}
</p>
)}
</div>

{/* Source Files URL */}
<div className="space-y-2">
<Label htmlFor="sourceFilesUrl" className="flex items-center gap-2">
<LinkIcon className="h-4 w-4" />
Link dos Arquivos (Drive, Dropbox, etc.)
</Label>
<Input
id="sourceFilesUrl"
placeholder="https://drive.google.com/..."
className={cn(errors.sourceFilesUrl && "border-destructive focus-visible:ring-destructive")}
{...register('sourceFilesUrl')}
/>
{errors.sourceFilesUrl && (
<p className="text-sm text-destructive flex items-center gap-1">
<AlertCircle className="h-3 w-3" />
{errors.sourceFilesUrl.message}
</p>
)}
<p className="text-xs text-muted-foreground">
Certifique-se de que o link está com permissão de acesso.
</p>
</div>

            {/* Deadline - Only show for fixed deadline services */}
            {selectedServiceType && !hasDynamicDeadline && minDeliveryDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Prazo de Entrega
                </Label>
                <Controller
                  control={control}
                  name="deadline"
                  render={({ field }) => (
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border-border shadow-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
                          disabled={isDateDisabled}
                          initialFocus
                          className="rounded-lg pointer-events-auto"
                        />
                        <div className="p-3 border-t border-border bg-muted/30">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              <span className="font-medium text-foreground">{selectedConfig?.name}:</span>{' '}
                              Prazo mínimo de {selectedConfig?.minBusinessDays} dias úteis
                            </span>
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.deadline && (
                  <p className="text-sm text-destructive">{errors.deadline.message}</p>
                )}
              </motion.div>
            )}

{/* Submit */}
<div className="flex gap-4 pt-4">
<Button
type="button"
variant="outline"
className="flex-1"
onClick={() => navigate(-1)}
disabled={isLoading}
>
Cancelar
</Button>
<Button
type="submit"
variant="premium"
className="flex-1 relative"
disabled={isLoading}
>
{isLoading ? (
<>
<Loader2 className="animate-spin h-4 w-4" />
Criando...
</>
) : (
<>
<Sparkles className="h-4 w-4" />
Criar Pedido
</>
)}
</Button>
</div>
{hasEmptyBalance && (
<p className="text-sm text-muted-foreground text-center">
Adicione saldos na sua conta para criar pedidos.
</p>
)}
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Dica:</strong> Ao criar um pedido, 1 unidade do serviço 
            selecionado será consumida do seu inventário. Você será notificado em cada etapa do processo.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NewOrderPage;
