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
import { useAvailableServices, useConsumeService } from '@/hooks/useServiceBalances';
import { useCreateOrder } from '@/hooks/useOrders';
import { useVideoFormats } from '@/hooks/useVideoFormats';
import { useAuth } from '@/contexts/AuthContext';

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
  videoFormatId: z.string().min(1, 'Selecione um formato de vídeo'),
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
  const consumeService = useConsumeService();
  const createOrderMutation = useCreateOrder();
  const { data: videoFormats = [], isLoading: isLoadingFormats } = useVideoFormats();

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
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  });

  const watchedServiceType = watch('serviceType');

  // Pre-select service from URL query param
  useEffect(() => {
    if (preSelectedService && availableServices.length > 0 && !watchedServiceType) {
      // Find matching service in available services
      const matchingService = availableServices.find((balance) => {
        const key = `${balance.serviceType}::${balance.planName || 'default'}`;
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
    if (!user?.id || !selectedVideoFormatId) return;

    try {
      // Consume service using FIFO logic (legacy, will be refactored in next step)
      const result = await consumeService.mutateAsync({
        userId: user.id,
        serviceType: selectedServiceType || 'Avulso',
      });

      if (!result.success) {
        return; // Error is handled by the mutation loop
      }

      // Create order with videoFormatId
      await createOrderMutation.mutateAsync({
        clientId: user.id,
        title: data.title,
        briefing: data.briefing,
        sourceFilesUrl: data.sourceFilesUrl,
        deadline: data.deadline?.toISOString() || new Date().toISOString(),
        videoFormatId: selectedVideoFormatId,
      });

      navigate('/orders');
    } catch (error) {
      // Error handled in hooks
    }
  };

  // Get icon for a service
  const getServiceIcon = (category: string) => {
    const Icon = categoryIcons[category] || Video;
    return <Icon className="h-4 w-4 mr-2" />;
  };

  const isLoading = consumeService.isPending || createOrderMutation.isPending || isLoadingFormats;

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
            Quanto mais detalhado o briefing, melhor o resultado final.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Video Format Selection - Dynamic Catalog (Fase 0) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Package className="h-4 w-4" />
              Formato do Vídeo
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Selecione o formato dinâmico do catálogo
            </p>
            <Controller
              control={control}
              name="videoFormatId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={handleVideoFormatChange}
                  disabled={isLoadingFormats}
                >
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder={isLoadingFormats ? "Carregando..." : "Selecione o formato de vídeo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {videoFormats.map((format) => (
                      <SelectItem
                        key={format.id}
                        value={format.id}
                        className="py-3"
                      >
                        <div className="flex items-center gap-3">
                          {getServiceIcon('avulso')}
                          <span>{format.name}</span>
                          <span className="text-muted-foreground ml-auto text-xs">
                            {format.maxDurationSeconds}s • {format.tier}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.videoFormatId && (
              <p className="text-sm text-destructive">{errors.videoFormatId.message}</p>
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
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
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
                {...register('briefing')}
              />
              {errors.briefing && (
                <p className="text-sm text-destructive">{errors.briefing.message}</p>
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
                {...register('sourceFilesUrl')}
              />
              {errors.sourceFilesUrl && (
                <p className="text-sm text-destructive">{errors.sourceFilesUrl.message}</p>
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
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="premium"
                className="flex-1"
                disabled={isLoading || !selectedServiceType}
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
