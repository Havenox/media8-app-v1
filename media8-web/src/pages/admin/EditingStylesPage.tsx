import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import {
  useEditingStyles,
  useCreateEditingStyle,
  useUpdateEditingStyle,
  useDeleteEditingStyle,
} from '@/hooks/useEditingStyles';
import { EditingStyle } from '@/types/services';

// ==========================================
// SCHEMA & TYPES
// ==========================================

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type FormData = z.infer<typeof formSchema>;

// ==========================================
// MAIN COMPONENT
// ==========================================

const EditingStylesPage: React.FC = () => {
  const { data: editingStyles = [], isLoading, refetch } = useEditingStyles();
  const createMutation = useCreateEditingStyle();
  const updateMutation = useUpdateEditingStyle();
  const deleteMutation = useDeleteEditingStyle();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<EditingStyle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register: registerForm,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Filter styles by search term
  const filteredStyles = editingStyles.filter(
    (style) =>
      style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      style.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Create
  const handleCreate = (data: FormData) => {
    createMutation.mutate({
      name: data.name,
      description: data.description,
    });
    setIsCreateOpen(false);
    reset();
  };

  // Handle Edit
  const handleEdit = (style: EditingStyle) => {
    setSelectedStyle(style);
    registerForm('name', { value: style.name });
    if (style.description) {
      registerForm('description', { value: style.description });
    }
    setIsEditOpen(true);
  };

  const handleUpdate = (data: FormData) => {
    if (!selectedStyle) return;
    updateMutation.mutate({
      id: selectedStyle.id,
      data: {
        name: data.name,
        description: data.description,
      },
    });
    setIsEditOpen(false);
    setSelectedStyle(null);
    reset();
  };

  // Handle Delete
  const handleDelete = (style: EditingStyle) => {
    if (window.confirm(`Tem certeza que deseja desativar o estilo "${style.name}"?`)) {
      deleteMutation.mutate(style.id);
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
            <Palette className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estilos de Edição</h1>
            <p className="text-sm text-muted-foreground">Gerencie os estilos de edição disponíveis</p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="premium" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Estilo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Novo Estilo</DialogTitle>
              <DialogDescription>
                Adicione um novo estilo de edição ao catálogo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Ex: Dinâmico"
                  {...registerForm('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Ex: Estilo com cortes rápidos e transições"
                  {...registerForm('description')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="premium"
                  disabled={isLoadingMutations}
                >
                  {isLoadingMutations ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Estilo'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estilos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Alert for empty state */}
      {editingStyles.length === 0 && !isLoading && (
        <Alert className="border-info/30 bg-info/10">
          <AlertTitle className="text-info">Nenhum estilo cadastrado</AlertTitle>
          <AlertDescription className="text-info/80">
            Comece criando seu primeiro estilo de edição clicando em "Novo Estilo".
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStyles.map((style) => (
              <TableRow key={style.id}>
                <TableCell className="font-medium">{style.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {style.description || '—'}
                </TableCell>
                <TableCell>
                  {style.isActive ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <X className="h-3 w-3" />
                      Inativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(style)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(style)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
};

export default EditingStylesPage;
