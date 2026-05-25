import React, { useState, useMemo } from 'react';
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
  RotateCcw,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [styleToDelete, setStyleToDelete] = useState<EditingStyle | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState<number>(5);
  const [isDeleteCounting, setIsDeleteCounting] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [styleToRestore, setStyleToRestore] = useState<EditingStyle | null>(null);

  const {
    register: registerForm,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Filter styles by tab and search term
  const filteredStyles = useMemo(() => {
    const tabFiltered = editingStyles.filter((style) => {
      if (activeTab === 'active') {
        return style.IsActive;
      } else {
        return !style.IsActive;
      }
    });

    return tabFiltered.filter(
      (style) =>
        style.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        style.Description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [editingStyles, activeTab, searchTerm]);

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
    registerForm('name', { value: style.Name });
    if (style.Description) {
      registerForm('description', { value: style.Description });
    }
    setIsEditOpen(true);
  };

  const handleUpdate = (data: FormData) => {
    if (!selectedStyle) return;
    updateMutation.mutate({
      id: selectedStyle.Id,
      data: {
        name: data.name,
        description: data.description,
      },
    });
    setIsEditOpen(false);
    setSelectedStyle(null);
    reset();
  };

  // Handle Soft Delete (arquiva - aba Ativos)
  const handleSoftDelete = (style: EditingStyle) => {
    setStyleToDelete(style);
    setIsDeleteDialogOpen(true);
  };

  // Handle Permanent Delete with timer (aba Arquivados)
  const startDeleteCountdown = () => {
    setIsDeleteCounting(true);
    setDeleteCountdown(5);

    const timer = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (styleToDelete) {
            deleteMutation.mutate({ id: styleToDelete.id, permanent: true });
          }
          setIsDeleteDialogOpen(false);
          setStyleToDelete(null);
          setIsDeleteCounting(false);
          setDeleteCountdown(5);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelDeleteCountdown = () => {
    setIsDeleteCounting(false);
    setDeleteCountdown(5);
  };

  // Handle Restore (reactivate)
  const handleRestore = (style: EditingStyle) => {
    setStyleToRestore(style);
    setIsRestoreDialogOpen(true);
  };

  const confirmRestore = () => {
    if (styleToRestore) {
      updateMutation.mutate({
        id: styleToRestore.id,
        data: { isActive: true },
      });
      setIsRestoreDialogOpen(false);
      setStyleToRestore(null);
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="active">
            Ativos ({editingStyles.filter((s) => s.isActive).length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Arquivados ({editingStyles.filter((s) => !s.isActive).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Carregando estilos...</p>
                </TableCell>
              </TableRow>
            ) : filteredStyles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum estilo encontrado.' : 'Nenhum estilo cadastrado.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredStyles.map((style) => (
                <TableRow key={style.Id}>
                  <TableCell className="font-medium">{style.Name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {style.Description || '—'}
                  </TableCell>
                  <TableCell>
                    {style.IsActive ? (
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
                        {style.IsActive ? (
                          <DropdownMenuItem
                            onClick={() => handleSoftDelete(style)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleRestore(style)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reativar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSoftDelete(style)}
                              className="text-destructive"
                              disabled={!style.canDeletePermanently}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {style.canDeletePermanently ? 'Excluir Definitivamente' : 'Não pode excluir'}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reativar Estilo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja reativar o estilo "{styleToRestore?.name}"? Ele voltará a ser visível no catálogo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={confirmRestore}>
              Reativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Active Tab (Archive Only) */}
      <Dialog open={isDeleteDialogOpen && activeTab === 'active'} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar Estilo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja mover o estilo "{styleToDelete?.name}" para os arquivados?
              Ele não será mais visível no catálogo ativo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (styleToDelete) {
                  deleteMutation.mutate({ id: styleToDelete.id, permanent: false });
                  setIsDeleteDialogOpen(false);
                  setStyleToDelete(null);
                }
              }}
            >
              Arquivar Estilo
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                cancelDeleteCountdown();
              }}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Archived Tab (With Timer for Permanent Delete) */}
      <Dialog open={isDeleteDialogOpen && activeTab === 'archived'} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {styleToDelete?.canDeletePermanently
                ? 'Excluir Permanentemente'
                : 'Não é possível excluir'}
            </DialogTitle>
            <DialogDescription>
              {styleToDelete?.canDeletePermanently
                ? `Tem certeza que deseja excluir permanentemente "${styleToDelete.name}"? Esta ação é irreversível.`
                : `O estilo "${styleToDelete?.name}" possui ofertas vinculadas e não pode ser excluído permanentemente.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2">
            {styleToDelete?.canDeletePermanently ? (
              <>
                {isDeleteCounting ? (
                  <div className="w-full space-y-2">
                    <p className="text-sm text-destructive font-medium">
                      Confirmando exclusão em {deleteCountdown}s...
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-destructive h-2 rounded-full transition-all"
                        style={{ width: `${(deleteCountdown / 5) * 100}%` }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={cancelDeleteCountdown}
                    >
                      Cancelar Exclusão
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={startDeleteCountdown}
                    disabled={isDeleteCounting}
                  >
                    Iniciar Exclusão (5s)
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="destructive"
                disabled
              >
                Arquivado (não pode excluir)
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                cancelDeleteCountdown();
              }}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default EditingStylesPage;
