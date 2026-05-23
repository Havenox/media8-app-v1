import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { EditingProfile, CreateEditingProfileRequest, UpdateEditingProfileRequest } from '@/types/brandingProfiles';
import { X } from 'lucide-react';

interface EditingProfileFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: EditingProfile | null;
  onSave: (data: CreateEditingProfileRequest | UpdateEditingProfileRequest) => void;
  isPending?: boolean;
}

export const EditingProfileForm: React.FC<EditingProfileFormProps> = ({
  open,
  onOpenChange,
  profile,
  onSave,
  isPending,
}) => {
  const { register, handleSubmit, setValue, watch, reset } = useForm<CreateEditingProfileRequest>({
    defaultValues: {
      name: '',
      referenceUrl: '',
      cutGuidelines: '',
      thumbnailPreference: '',
      musicStyle: '',
      useVideoHook: false,
      textHighlightStyle: '',
      generalNotes: '',
    },
  });

  // Multiple reference URLs state
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      if (profile) {
        // Parse reference URLs from newline-separated string
        const urls = profile.referenceUrl ? profile.referenceUrl.split('\n').filter(url => url.trim()) : [];
        setReferenceUrls(urls.length > 0 ? urls : ['']);
        
        reset({
          name: profile.name,
          referenceUrl: profile.referenceUrl,
          cutGuidelines: profile.cutGuidelines,
          thumbnailPreference: profile.thumbnailPreference,
          musicStyle: profile.musicStyle,
          useVideoHook: profile.useVideoHook,
          textHighlightStyle: profile.textHighlightStyle,
          generalNotes: profile.generalNotes,
        });
      } else {
        setReferenceUrls(['']);
        reset({
          name: '',
          referenceUrl: '',
          cutGuidelines: '',
          thumbnailPreference: '',
          musicStyle: '',
          useVideoHook: false,
          textHighlightStyle: '',
          generalNotes: '',
        });
      }
    }
  }, [open, profile, reset]);

  const onSubmit = (data: CreateEditingProfileRequest | UpdateEditingProfileRequest) => {
    // Join reference URLs with newline
    const referenceString = referenceUrls.filter(url => url.trim()).join('\n');
    onSave({ ...data, referenceUrl: referenceString } as any);
  };

  const addReferenceUrl = () => {
    setReferenceUrls([...referenceUrls, '']);
  };

  const removeReferenceUrl = (index: number) => {
    const newUrls = referenceUrls.filter((_, i) => i !== index);
    setReferenceUrls(newUrls.length > 0 ? newUrls : ['']);
  };

  const updateReferenceUrl = (index: number, value: string) => {
    const newUrls = [...referenceUrls];
    newUrls[index] = value;
    setReferenceUrls(newUrls);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {profile ? 'Editar Perfil de Edição' : 'Novo Perfil de Edição'}
          </DialogTitle>
          <DialogDescription>
            Defina suas preferências artísticas e de ritmo para seus vídeos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome do Estilo */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Estilo</Label>
            <Input
              id="name"
              placeholder="Ex: Reels Dinâmicos, Vlogs, Aulas"
              {...register('name', { required: true })}
            />
          </div>

          {/* Referências de Edição (Múltiplos Links) */}
          <div className="space-y-2">
            <Label>
              Tem alguma referência de edição que você gostaria que eu seguisse? (Adicione o link)
            </Label>
            <div className="space-y-2">
              {referenceUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Ex: https://instagram.com/reel/..."
                    value={url}
                    onChange={(e) => updateReferenceUrl(index, e.target.value)}
                    className="flex-1"
                  />
                  {referenceUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeReferenceUrl(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addReferenceUrl}
                className="w-full"
              >
                <span className="mr-2">+</span> Adicionar Link
              </Button>
            </div>
          </div>

          {/* Diretrizes de Corte */}
          <div className="space-y-2">
            <Label htmlFor="cutGuidelines">
              Há partes do vídeo original que precisam ser mantidas ou removidas obrigatoriamente?
            </Label>
            <Textarea
              id="cutGuidelines"
              placeholder="Ex: Manter a introdução, remover pausas longas, etc."
              {...register('cutGuidelines')}
              rows={3}
            />
          </div>

          {/* Preferência de Thumbnail */}
          <div className="space-y-2">
            <Label htmlFor="thumbnailPreference">
              Deseja que eu crie a thumbnail (capa) do vídeo?
            </Label>
            <Select
              value={watch('thumbnailPreference')}
              onValueChange={(value) => setValue('thumbnailPreference', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim">Sim</SelectItem>
                <SelectItem value="Não">Não</SelectItem>
                <SelectItem value="Já tenho a capa pronta">Já tenho a capa pronta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estilo Musical */}
          <div className="space-y-2">
            <Label htmlFor="musicStyle">
              Qual a trilha sonora ou estilo musical que você prefere?
            </Label>
            <Input
              id="musicStyle"
              placeholder="Ex: Lo-fi, Jazz, Eletrônica, etc."
              {...register('musicStyle')}
            />
          </div>

          {/* Gancho/Hook */}
          <div className="flex items-center justify-between space-y-2">
            <div className="space-y-0.5">
              <Label htmlFor="useVideoHook">
                Deseja destacar algum momento do vídeo como "clipe principal" para usar nos primeiros segundos?
              </Label>
              <p className="text-sm text-muted-foreground">
                Isso será usado como gancho inicial nos seus vídeos
              </p>
            </div>
            <Switch
              id="useVideoHook"
              checked={watch('useVideoHook')}
              onCheckedChange={(value) => setValue('useVideoHook', value)}
            />
          </div>

          {/* Destaques Visuais */}
          <div className="space-y-2">
            <Label htmlFor="textHighlightStyle">
              Alguma palavra, expressão ou tema central que você quer que apareça com destaque visual?
            </Label>
            <Input
              id="textHighlightStyle"
              placeholder="Ex: Palavras-chave, expressões, temas"
              {...register('textHighlightStyle')}
            />
          </div>

          {/* Notas Gerais */}
          <div className="space-y-2">
            <Label htmlFor="generalNotes">
              Informações extras importantes para essa edição / Algo mais que você queira incluir?
            </Label>
            <Textarea
              id="generalNotes"
              placeholder="Descreva detalhes adicionais, preferências, ou qualquer informação relevante"
              {...register('generalNotes')}
              rows={4}
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
