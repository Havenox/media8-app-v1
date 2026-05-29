import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Archive,
  Trash2,
  RotateCcw,
  MoreVertical,
  Plus,
  Pencil,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useEditingProfiles,
  useArchiveEditingProfile,
  useRestoreEditingProfile,
  useHardDeleteEditingProfile,
  useCreateEditingProfile,
  useUpdateEditingProfile,
} from '@/hooks/useEditingProfiles';
import { EditingProfileForm } from '@/components/profiles/EditingProfileForm';
import { useAuth } from '@/contexts/AuthContext';
import { EditingProfile } from '@/types/brandingProfiles';
import { formatSequentialId } from '@/lib/formatters';

const EditingProfilesPage: React.FC = () => {
  const { user } = useAuth();
  const [showArchived, setShowArchived] = useState(false);

  // Editing Profiles
  const {
    data: editingProfiles,
    isLoading: isLoadingEditing,
    refetch: refetchEditing,
  } = useEditingProfiles(!showArchived);

  const archiveEditingMutation = useArchiveEditingProfile();
  const restoreEditingMutation = useRestoreEditingProfile();
  const hardDeleteEditingMutation = useHardDeleteEditingProfile();
  const createEditingMutation = useCreateEditingProfile();
  const updateEditingMutation = useUpdateEditingProfile();

  // Dialog states
  const [profileToDelete, setProfileToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Form states
  const [editingFormOpen, setEditingFormOpen] = useState(false);
  const [selectedEditingProfile, setSelectedEditingProfile] = useState<EditingProfile | null>(null);

  const handleArchive = (id: string, name: string) => {
    archiveEditingMutation.mutate(id, {
      onSuccess: () => refetchEditing(),
    });
  };

  const handleRestore = (id: string, name: string) => {
    restoreEditingMutation.mutate(id, {
      onSuccess: () => refetchEditing(),
    });
  };

  const handleHardDelete = (id: string, name: string) => {
    setProfileToDelete({ id, name });
  };

  const confirmHardDelete = () => {
    if (!profileToDelete) return;

    const { id } = profileToDelete;

    hardDeleteEditingMutation.mutate(id, {
      onSuccess: () => {
        refetchEditing();
        setProfileToDelete(null);
      },
    });
  };

  const handleOpenEditingForm = (profile?: EditingProfile) => {
    setSelectedEditingProfile(profile || null);
    setEditingFormOpen(true);
  };

  const handleSaveEditing = (data: any) => {
    if (selectedEditingProfile) {
      updateEditingMutation.mutate(
        { id: selectedEditingProfile.id, data },
        {
          onSuccess: () => {
            refetchEditing();
            setEditingFormOpen(false);
            setSelectedEditingProfile(null);
          },
        }
      );
    } else {
      createEditingMutation.mutate(data as any, {
        onSuccess: () => {
          refetchEditing();
          setEditingFormOpen(false);
        },
      });
    }
  };

  const renderEditingProfileRow = (profile: any) => (
    <TableRow key={profile.Id} className="group">
      <TableCell className="font-medium flex items-center gap-1.5 min-w-0">
        {profile.SequentialId && (
          <span className="text-[10px] font-mono bg-[#7B0A0A]/5 border border-[#7B0A0A]/15 text-[#7B0A0A] font-bold px-1.5 py-[0.5px] rounded shrink-0 leading-none">
            {formatSequentialId(profile.SequentialId, 'Perfil')}
          </span>
        )}
        <span className="truncate">{profile.Name}</span>
      </TableCell>
      <TableCell className="hidden md:table-cell">{profile.MusicStyle}</TableCell>
      <TableCell className="hidden lg:table-cell">{profile.ThumbnailPreference}</TableCell>
      <TableCell className="hidden lg:table-cell">
        {profile.UseVideoHook ? 'Sim' : 'Não'}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenEditingForm(profile)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {!showArchived ? (
<>
      <DropdownMenuItem onClick={() => handleArchive(profile.Id, profile.Name)}>
        <Archive className="mr-2 h-4 w-4" />
        Arquivar
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleHardDelete(profile.Id, profile.Name)}
        className="text-destructive focus:text-destructive"
      >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Permanentemente
                </DropdownMenuItem>
              </>
            ) : (
    <>
      <DropdownMenuItem onClick={() => handleRestore(profile.Id, profile.Name)}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Restaurar
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleHardDelete(profile.Id, profile.Name)}
        className="text-destructive focus:text-destructive"
      >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Permanentemente
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  const renderSkeletonRows = () => (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-8 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Perfis de Edição
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os estilos de edição dos seus vídeos
            </p>
          </div>
          <Button
            variant="default"
            onClick={() => handleOpenEditingForm()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Perfil
          </Button>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            {showArchived ? 'Perfis de Edição Arquivados' : 'Perfis de Edição Ativos'}
          </CardTitle>
          <CardDescription>
            {showArchived
              ? 'Perfis arquivados podem ser restaurados ou excluídos permanentemente'
              : 'Gerencie os estilos de edição dos seus vídeos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={showArchived ? 'bg-muted' : ''}
            >
              {showArchived ? 'Ocultar arquivados' : 'Exibir arquivados'}
            </Button>
          </div>

          {isLoadingEditing ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Estilo Musical</TableHead>
                  <TableHead className="hidden lg:table-cell">Thumbnail</TableHead>
                  <TableHead className="hidden lg:table-cell">Hook</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderSkeletonRows()}</TableBody>
            </Table>
          ) : editingProfiles && editingProfiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Estilo Musical</TableHead>
                  <TableHead className="hidden lg:table-cell">Thumbnail</TableHead>
                  <TableHead className="hidden lg:table-cell">Hook</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {editingProfiles.map((profile) => renderEditingProfileRow(profile))}
                </AnimatePresence>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                {showArchived ? (
                  <Archive className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Film className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {showArchived ? 'Nenhum perfil arquivado' : 'Nenhum perfil encontrado'}
              </h3>
              <p className="text-muted-foreground">
                {showArchived
                  ? 'Os perfis arquivados aparecerão aqui'
                  : 'Comece criando um novo perfil de edição'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog
        open={!!profileToDelete}
        onOpenChange={() => setProfileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O perfil "
              {profileToDelete?.name}" será excluído permanentemente do
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHardDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Form */}
      <EditingProfileForm
        open={editingFormOpen}
        onOpenChange={setEditingFormOpen}
        profile={selectedEditingProfile}
        onSave={handleSaveEditing}
        isPending={createEditingMutation.isPending || updateEditingMutation.isPending}
      />
    </div>
  );
};

export default EditingProfilesPage;
