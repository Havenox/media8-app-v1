import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Film,
  Archive,
  Trash2,
  RotateCcw,
  MoreVertical,
  Plus,
  Search,
  Eye,
  EyeOff,
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  useVisualIdentityProfiles,
  useArchiveVisualIdentityProfile,
  useRestoreVisualIdentityProfile,
  useHardDeleteVisualIdentityProfile,
} from '@/hooks/useProfiles';
import {
  useEditingProfiles,
  useArchiveEditingProfile,
  useRestoreEditingProfile,
  useHardDeleteEditingProfile,
} from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ProfilesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'visual' | 'editing'>('visual');
  const [showArchived, setShowArchived] = useState(false);

  // Visual Identity Profiles
  const {
    data: visualProfiles,
    isLoading: isLoadingVisual,
    refetch: refetchVisual,
  } = useVisualIdentityProfiles(!showArchived);

  const archiveVisualMutation = useArchiveVisualIdentityProfile();
  const restoreVisualMutation = useRestoreVisualIdentityProfile();
  const hardDeleteVisualMutation = useHardDeleteVisualIdentityProfile();

  // Editing Profiles
  const {
    data: editingProfiles,
    isLoading: isLoadingEditing,
    refetch: refetchEditing,
  } = useEditingProfiles(!showArchived);

  const archiveEditingMutation = useArchiveEditingProfile();
  const restoreEditingMutation = useRestoreEditingProfile();
  const hardDeleteEditingMutation = useHardDeleteEditingProfile();

  // Dialog states
  const [profileToDelete, setProfileToDelete] = useState<{
    id: string;
    type: 'visual' | 'editing';
    name: string;
  } | null>(null);

  const handleArchive = (
    id: string,
    type: 'visual' | 'editing',
    name: string
  ) => {
    if (type === 'visual') {
      archiveVisualMutation.mutate(id, {
        onSuccess: () => refetchVisual(),
      });
    } else {
      archiveEditingMutation.mutate(id, {
        onSuccess: () => refetchEditing(),
      });
    }
  };

  const handleRestore = (
    id: string,
    type: 'visual' | 'editing',
    name: string
  ) => {
    if (type === 'visual') {
      restoreVisualMutation.mutate(id, {
        onSuccess: () => refetchVisual(),
      });
    } else {
      restoreEditingMutation.mutate(id, {
        onSuccess: () => refetchEditing(),
      });
    }
  };

  const handleHardDelete = (
    id: string,
    type: 'visual' | 'editing',
    name: string
  ) => {
    setProfileToDelete({ id, type, name });
  };

  const confirmHardDelete = () => {
    if (!profileToDelete) return;

    const { id, type } = profileToDelete;

    if (type === 'visual') {
      hardDeleteVisualMutation.mutate(id, {
        onSuccess: () => {
          refetchVisual();
          setProfileToDelete(null);
        },
      });
    } else {
      hardDeleteEditingMutation.mutate(id, {
        onSuccess: () => {
          refetchEditing();
          setProfileToDelete(null);
        },
      });
    }
  };

  const renderVisualIdentityRow = (profile: any) => (
    <TableRow key={profile.id} className="group">
      <TableCell className="font-medium">{profile.name}</TableCell>
      <TableCell className="hidden md:table-cell">{profile.brandColors}</TableCell>
      <TableCell className="hidden lg:table-cell">{profile.brandFonts}</TableCell>
      <TableCell className="hidden lg:table-cell">{profile.targetAudience}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!showArchived ? (
              <>
                <DropdownMenuItem onClick={() => handleArchive(profile.id, 'visual', profile.name)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleHardDelete(profile.id, 'visual', profile.name)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Permanentemente
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => handleRestore(profile.id, 'visual', profile.name)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleHardDelete(profile.id, 'visual', profile.name)}
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

  const renderEditingProfileRow = (profile: any) => (
    <TableRow key={profile.id} className="group">
      <TableCell className="font-medium">{profile.name}</TableCell>
      <TableCell className="hidden md:table-cell">{profile.musicStyle}</TableCell>
      <TableCell className="hidden lg:table-cell">{profile.thumbnailPreference}</TableCell>
      <TableCell className="hidden lg:table-cell">
        {profile.useVideoHook ? 'Sim' : 'Não'}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!showArchived ? (
              <>
                <DropdownMenuItem onClick={() => handleArchive(profile.id, 'editing', profile.name)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleHardDelete(profile.id, 'editing', profile.name)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Permanentemente
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => handleRestore(profile.id, 'editing', profile.name)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleHardDelete(profile.id, 'editing', profile.name)}
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
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Meus Perfis
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas identidades visuais e perfis de edição
            </p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Plus className="mr-2 h-4 w-4" />
            Novo Perfil
          </Button>
        </div>
      </motion.div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'visual' | 'editing')} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Identidade Visual
            </TabsTrigger>
            <TabsTrigger value="editing" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Perfil de Edição
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant={showArchived ? 'default' : 'outline'}
              onClick={() => setShowArchived(!showArchived)}
              className="gap-2"
            >
              {showArchived ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Arquivados
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Ativos
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Visual Identity Content */}
        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-600" />
                {showArchived ? 'Identidades Visuais Arquivadas' : 'Identidades Visuais Ativas'}
              </CardTitle>
              <CardDescription>
                {showArchived
                  ? 'Perfis arquivados podem ser restaurados ou excluídos permanentemente'
                  : 'Gerencie as identidades visuais da sua marca'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingVisual ? (
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
              ) : visualProfiles && visualProfiles.length > 0 ? (
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
                      {visualProfiles.map((profile) => renderVisualIdentityRow(profile))}
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
                      : 'Comece criando um novo perfil de identidade visual'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editing Profile Content */}
        <TabsContent value="editing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5 text-pink-600" />
                {showArchived ? 'Perfis de Edição Arquivados' : 'Perfis de Edição Ativos'}
              </CardTitle>
              <CardDescription>
                {showArchived
                  ? 'Perfis arquivados podem ser restaurados ou excluídos permanentemente'
                  : 'Gerencie os estilos de edição dos seus vídeos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
        </TabsContent>
      </Tabs>

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
    </div>
  );
};

export default ProfilesPage;
