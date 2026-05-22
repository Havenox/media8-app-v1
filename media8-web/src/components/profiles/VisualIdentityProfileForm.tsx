import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { VisualIdentityProfile, CreateVisualIdentityProfileRequest, UpdateVisualIdentityProfileRequest } from '@/types/profiles';

interface VisualIdentityProfileFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: VisualIdentityProfile | null;
  onSave: (data: CreateVisualIdentityProfileRequest | UpdateVisualIdentityProfileRequest) => void;
  isPending?: boolean;
}

export const VisualIdentityProfileForm: React.FC<VisualIdentityProfileFormProps> = ({
  open,
  onOpenChange,
  profile,
  onSave,
  isPending,
}) => {
  const { register, handleSubmit, setValue, watch, reset } = useForm<CreateVisualIdentityProfileRequest>({
    defaultValues: {
      name: '',
      socialHandles: '',
      brandColors: '',
      brandFonts: '',
      targetAudience: '',
      brandAssetsUrl: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (profile) {
        reset({
          name: profile.name,
          socialHandles: profile.socialHandles,
          brandColors: profile.brandColors,
          brandFonts: profile.brandFonts,
          targetAudience: profile.targetAudience,
          brandAssetsUrl: profile.brandAssetsUrl,
        });
      } else {
        reset({
          name: '',
          socialHandles: '',
          brandColors: '',
          brandFonts: '',
          targetAudience: '',
          brandAssetsUrl: '',
        });
      }
    }
  }, [open, profile, reset]);

  const onSubmit = (data: CreateVisualIdentityProfileRequest | UpdateVisualIdentityProfileRequest) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {profile ? 'Editar Identidade Visual' : 'Nova Identidade Visual'}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações da sua marca. Estes dados serão reutilizados em futuros pedidos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome do Perfil */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Perfil</Label>
            <Input
              id="name"
              placeholder="Ex: Marca Pessoal, Empresa X"
              {...register('name', { required: true })}
            />
          </div>

          {/* Nome e Redes Sociais */}
          <div className="space-y-2">
            <Label htmlFor="socialHandles">
              Seu nome e as suas redes sociais ou da sua empresa: (Adicione seu nome mais o @ delas)
            </Label>
            <Textarea
              id="socialHandles"
              placeholder="Ex: João Silva | @joaosilva no Instagram, @joao no LinkedIn"
              {...register('socialHandles', { required: true })}
              rows={3}
            />
          </div>

          {/* Cores da Marca */}
          <div className="space-y-2">
            <Label htmlFor="brandColors">
              Qual a cor ou cores da sua marca? (Adicione o código exato da cor. Exemplo: #000000)
            </Label>
            <Input
              id="brandColors"
              placeholder="Ex: #400404, #FFFBED, #000000"
              {...register('brandColors', { required: true })}
            />
          </div>

          {/* Fontes da Marca */}
          <div className="space-y-2">
            <Label htmlFor="brandFonts">
              Qual a fonte ou fontes da sua marca? (Adicione o nome da fonte ou envie o arquivo no Drive)
            </Label>
            <Input
              id="brandFonts"
              placeholder="Ex: Helvetica, Arial, ou link do Google Drive"
              {...register('brandFonts', { required: true })}
            />
          </div>

          {/* Público-Alvo */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">
              Para qual público-alvo este vídeo será direcionado?
            </Label>
            <Select
              value={watch('targetAudience')}
              onValueChange={(value) => setValue('targetAudience', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o público-alvo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mulheres">Mulheres</SelectItem>
                <SelectItem value="Homens">Homens</SelectItem>
                <SelectItem value="Jovens empreendedores">Jovens empreendedores</SelectItem>
                <SelectItem value="Público corporativo">Público corporativo</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assets da Marca */}
          <div className="space-y-2">
            <Label htmlFor="brandAssetsUrl">
              Há imagens, vídeos, logos, CTAs ou arquivos específicos que devo utilizar? (Envie os arquivos no Drive)
            </Label>
            <Input
              id="brandAssetsUrl"
              placeholder="Ex: https://drive.google.com/pasta/meus-assets"
              {...register('brandAssetsUrl')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : profile ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
