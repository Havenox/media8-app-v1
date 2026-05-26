import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface SystemSettingsResponse {
  settings?: Record<string, string>;
  Settings?: Record<string, string>;
}

interface UpdateSettingsRequest {
  key: string;
  value: string;
}

const AdminSettingsSection: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Fetch system settings (Admin only)
  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const response = await api.get<SystemSettingsResponse>('/admin/settings');
      return response.data;
    },
    enabled: user?.Role === 'Admin',
    retry: 2,
  });

  // Initialize local state when data loads
  React.useEffect(() => {
    if (settingsData?.Settings) {
      setLocalSettings(settingsData.Settings);
    }
  }, [settingsData]);

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: UpdateSettingsRequest) => {
      const response = await api.patch('/admin/settings', { Key: key, Value: value });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast({
        title: 'Configuração atualizada',
        description: 'A alteração foi salva com sucesso.',
      });
      setIsDirty(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.response?.data?.message || 'Falha ao salvar configuração',
        variant: 'destructive',
      });
    },
  });

  const handleSave = async () => {
    if (!settingsData) return;

    const originalSettings = settingsData.Settings || {};
    const changes = Object.entries(localSettings).filter(
      ([key, value]) => originalSettings[key] !== value
    );

    if (changes.length === 0) {
      toast({
        title: 'Sem alterações',
        description: 'Nenhuma mudança para salvar.',
      });
      return;
    }

    await Promise.all(
      changes.map(([key, value]) =>
        updateSettingMutation.mutateAsync({ key, value })
      )
    );
  };

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  // Render null if not admin
  if (user?.Role !== 'Admin') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Gerencie as configurações globais do sistema (apenas para administradores)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTitle className="text-sm font-medium">
              ⚠️ Atenção
            </AlertTitle>
            <AlertDescription className="text-sm">
              As alterações nestas configurações afetam todo o sistema e são aplicadas imediatamente.
            </AlertDescription>
          </Alert>

          <Separator />

        {/* CancellationWindowHours */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="CancellationWindowHours" className="text-base font-semibold">
              Janela de Cancelamento (horas)
            </Label>
            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
              {localSettings['CancellationWindowHours'] ? `${localSettings['CancellationWindowHours']}h` : '—'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tempo máximo após a criação do pedido em que o cliente pode cancelar com estorno automático.
          </p>
          <Input
            id="CancellationWindowHours"
            type="number"
            value={localSettings['CancellationWindowHours'] ?? ''}
            onChange={(e) => handleSettingChange('CancellationWindowHours', e.target.value)}
            className="max-w-xs"
            placeholder="Carregando..."
          />
        </div>

          <Separator />

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleSave}
              disabled={updateSettingMutation.isPending || !isDirty}
              className="gap-2"
            >
              {updateSettingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
            {isDirty && (
              <span className="text-xs text-muted-foreground">
                Alterações não salvas
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminSettingsSection;
