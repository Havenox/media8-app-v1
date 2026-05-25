import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
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
  useBrandingProfiles,
  useArchiveBrandingProfile,
  useRestoreBrandingProfile,
  useHardDeleteBrandingProfile,
  useCreateBrandingProfile,
  useUpdateBrandingProfile,
} from '@/hooks/useBrandingProfiles';
import { BrandingProfileForm } from '@/components/profiles/BrandingProfileForm';
import { useAuth } from '@/contexts/AuthContext';
import { BrandingProfile } from '@/types/brandingProfiles';

const BrandingProfilesPage: React.FC = () => {
  const { user } = useAuth();
  const [showArchived, setShowArchived] = useState(false);

  // Branding Profiles
  const {
    data: brandingProfiles,
    isLoading: isLoadingBranding,
    refetch: refetchBranding,
  } = useBrandingProfiles(!showArchived);

  // Debug: Log data and loading state
  React.useEffect(() => {
    console.log('[BrandingProfilesPage] Data:', brandingProfiles);
    console.log('[BrandingProfilesPage] IsLoading:', isLoadingBranding);
    console.log('[BrandingProfilesPage] Count:', brandingProfiles?.length || 0);
  }, [brandingProfiles, isLoadingBranding]);

  const archiveBrandingMutation = useArchiveBrandingProfile();
  const restoreBrandingMutation = useRestoreBrandingProfile();
  const hardDeleteBrandingMutation = useHardDeleteBrandingProfile();
  const createBrandingMutation = useCreateBrandingProfile();
  const updateBrandingMutation = useUpdateBrandingProfile();

  // Dialog states
  const [profileToDelete, setProfileToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Form states
  const [brandingFormOpen, setBrandingFormOpen] = useState(false);
  const [selectedBrandingProfile, setSelectedBrandingProfile] = useState<BrandingProfile | null>(null);

  const handleArchive = (id: string, name: string) => {
    archiveBrandingMutation.mutate(id, {
      onSuccess: () => refetchBranding(),
    });
  };

  const handleRestore = (id: string, name: string) => {
    restoreBrandingMutation.mutate(id, {
      onSuccess: () => refetchBranding(),
    });
  };

  const handleHardDelete = (id: string, name: string) => {
    setProfileToDelete({ id, name });
  };

  const confirmHardDelete = () => {
    if (!profileToDelete) return;

    const { id } = profileToDelete;

    hardDeleteBrandingMutation.mutate(id, {
      onSuccess: () => {
        refetchBranding();
        setProfileToDelete(null);
      },
    });
  };

  const handleOpenBrandingForm = (profile?: BrandingProfile) => {
    setSelectedBrandingProfile(profile || null);
    setBrandingFormOpen(true);
  };

  const handleSaveBranding = (data: any) => {
    if (selectedBrandingProfile) {
      updateBrandingMutation.mutate(
        { id: selectedBrandingProfile.id, data },
        {
          onSuccess: () => {
            refetchBranding();
            setBrandingFormOpen(false);
            setSelectedBrandingProfile(null);
          },
        }
      );
    } else {
      createBrandingMutation.mutate(data as any, {
        onSuccess: () => {
          refetchBranding();
          setBrandingFormOpen(false);
        },
      });
    }
  };

  const renderBrandingProfileRow = (profile: any) => (
    <TableRow key={profile.Id} className="group">
      <TableCell className="font-medium">{profile.Name}</TableCell>
      <TableCell className="hidden md:table-cell">{profile.BrandColors}</TableCell>
      <TableCell className="hidden lg:table-cell">{profile.BrandFonts}</TableCell>
      <TableCell className="hidden lg:table-cell">{profile.TargetAudience}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenBrandingForm(profile)}>
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
              Perfis de Branding
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os perfis de branding da sua marca
            </p>
          </div>
          <Button
            variant="default"
            onClick={() => handleOpenBrandingForm()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Perfil
          </Button>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            {showArchived ? 'Perfis de Branding Arquivados' : 'Perfis de Branding Ativos'}
          </CardTitle>
          <CardDescription>
            {showArchived
              ? 'Perfis arquivados podem ser restaurados ou excluídos permanentemente'
              : 'Gerencie os perfis de branding da sua marca'}
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

          {isLoadingBranding ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Cores</TableHead>
                  <TableHead className="hidden lg:table-cell">Fontes</TableHead>
                  <TableHead className="hidden lg:table-cell">Público</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderSkeletonRows()}</TableBody>
            </Table>
          ) : brandingProfiles && brandingProfiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Cores</TableHead>
                  <TableHead className="hidden lg:table-cell">Fontes</TableHead>
                  <TableHead className="hidden lg:table-cell">Público</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {brandingProfiles.map((profile) => renderBrandingProfileRow(profile))}
                </AnimatePresence>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                {showArchived ? (
                  <Archive className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Palette className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {showArchived ? 'Nenhum perfil arquivado' : 'Nenhum perfil encontrado'}
              </h3>
              <p className="text-muted-foreground">
                {showArchived
                  ? 'Os perfis arquivados aparecerão aqui'
                  : 'Comece criando um novo perfil de branding'}
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
      <BrandingProfileForm
        open={brandingFormOpen}
        onOpenChange={setBrandingFormOpen}
        profile={selectedBrandingProfile}
        onSave={handleSaveBranding}
        isPending={createBrandingMutation.isPending || updateBrandingMutation.isPending}
      />
    </div>
  );
};

export default BrandingProfilesPage;
