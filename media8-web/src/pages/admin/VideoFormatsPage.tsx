import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Plus,
  Edit,
  Trash2,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { useVideoFormats, useCreateVideoFormat, useUpdateVideoFormat, useDeleteVideoFormat } from '@/hooks/useVideoFormats';
import { VideoFormat } from '@/types/api';

// ==========================================
// SCHEMA & TYPES
// ==========================================

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  slug: z.string().min(3, 'Slug deve ter no mínimo 3 caracteres').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido'),
  maxDurationSeconds: z.coerce.number().min(15, 'Mínimo 15 segundos').max(7200, 'Máximo 7200 segundos'),
  tier: z.enum(['Standard', 'Premium', 'GodMode']),
});

type FormData = z.infer<typeof formSchema>;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const getTierBadgeVariant = (tier: string) => {
  switch (tier) {
    case 'Standard': return 'secondary';
    case 'Premium': return 'default';
    case 'GodMode': return 'destructive';
    default: return 'outline';
  }
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const VideoFormatsPage: React.FC = () => {
  const { data: videoFormats = [], isLoading, refetch } = useVideoFormats();
  const createMutation = useCreateVideoFormat();
  const updateMutation = useUpdateVideoFormat();
  const deleteMutation = useDeleteVideoFormat();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register: registerForm,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Filter formats by search term
  const filteredFormats = videoFormats.filter((format) =>
    format.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    format.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Create
  const handleCreate = (data: FormData) => {
    createMutation.mutate({
      name: data.name,
      slug: data.slug,
      maxDurationSeconds: data.maxDurationSeconds,
      tier: data.tier,
    });
    setIsCreateOpen(false);
    reset();
  };

  // Handle Edit
  const handleEdit = (format: VideoFormat) => {
    setSelectedFormat(format);
    setValue('name', format.name);
    setValue('slug', format.slug);
    setValue('maxDurationSeconds', format.maxDurationSeconds);
    setValue('tier', format.tier as any);
    setIsEditOpen(true);
  };

  const handleUpdate = (data: FormData) => {
    if (!selectedFormat) return;
    updateMutation.mutate({
      id: selectedFormat.id,
      data: {
        name: data.name,
        slug: data.slug,
        maxDurationSeconds: data.maxDurationSeconds,
        tier: data.tier,
      },
    });
    setIsEditOpen(false);
    setSelectedFormat(null);
    reset();
  };

  // Handle Delete
  const handleDelete = (format: VideoFormat) => {
    if (window.confirm(`Tem certeza que deseja desativar o formato "${format.name}"?`)) {
      deleteMutation.mutate(format.id);
    }
  };

  const isLoadingMutations = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Film className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Formatos de Vídeo</h1>
            <p className="text-sm text-muted-foreground">Gerencie o catálogo dinâmico de formatos</p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="premium" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Formato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Novo Formato</DialogTitle>
              <DialogDescription>
                Adicione um novo formato de vídeo ao catálogo dinâmico
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Ex: Reels Premium"
                  {...registerForm('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="ex: reels-premium"
                  {...registerForm('slug')}
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDurationSeconds">Duração Máx. (segundos)</Label>
                  <Input
                    id="maxDurationSeconds"
                    type="number"
                    placeholder="90"
                    {...registerForm('maxDurationSeconds', { valueAsNumber: true })}
                  />
                  {errors.maxDurationSeconds && (
                    <p className="text-sm text-destructive">{errors.maxDurationSeconds.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">Complexidade (Tier)</Label>
                  <Controller
                    control={control}
                    name="tier"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Premium">Premium</SelectItem>
                          <SelectItem value="GodMode">GodMode</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.tier && (
                    <p className="text-sm text-destructive">{errors.tier.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="premium" disabled={isLoadingMutations}>
                  {isLoadingMutations ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Criar Formato
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar formatos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Formats Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-32">Duração Máx.</TableHead>
              <TableHead className="w-32">Tier</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Carregando formatos...</p>
                </TableCell>
              </TableRow>
            ) : filteredFormats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum formato encontrado.' : 'Nenhum formato cadastrado.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredFormats.map((format) => (
                <TableRow key={format.id}>
                  <TableCell className="font-medium">{format.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{format.slug}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {formatDuration(format.maxDurationSeconds)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTierBadgeVariant(format.tier)}>{format.tier}</Badge>
                  </TableCell>
                  <TableCell>
                    {format.isActive ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(format)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(format)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Formato</DialogTitle>
            <DialogDescription>
              Atualize os dados do formato de vídeo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                {...registerForm('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                {...registerForm('slug')}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maxDurationSeconds">Duração Máx. (segundos)</Label>
                <Input
                  id="edit-maxDurationSeconds"
                  type="number"
                  {...registerForm('maxDurationSeconds', { valueAsNumber: true })}
                />
                {errors.maxDurationSeconds && (
                  <p className="text-sm text-destructive">{errors.maxDurationSeconds.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tier">Complexidade (Tier)</Label>
                <Controller
                  control={control}
                  name="tier"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="GodMode">GodMode</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.tier && (
                  <p className="text-sm text-destructive">{errors.tier.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="premium" disabled={isLoadingMutations}>
                {isLoadingMutations ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default VideoFormatsPage;
