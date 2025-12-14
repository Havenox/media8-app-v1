import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Bell,
  Palette,
  Shield,
  Loader2,
  Check,
  Camera,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailComments: true,
    emailMarketing: false,
    pushOrders: true,
    pushComments: false,
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Fetch latest data on mount
  React.useEffect(() => {
    if (user?.id) {
       userService.getById(user.id).then((u) => {
         if (u) {
           setProfile({
             name: u.name,
             email: u.email,
             bio: u.bio || '',
             phone: u.phone || '',
           });
           if (u.preferences) {
             try {
               const prefs = JSON.parse(u.preferences);
               if (prefs.notifications) {
                 setNotifications(prev => ({...prev, ...prefs.notifications}));
               }
             } catch (e) {
               console.error("Failed to parse preferences", e);
             }
           }
         }
       });
    }
  }, [user?.id]);


  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      await userService.updateProfile(user.id, {
        name: profile.name,
        bio: profile.bio,
        phone: profile.phone,
        // Preserve existing preferences logic if needed here, but handled in separate save for now or should we merge?
        // Let's send notifications as part of preferences here too to avoid partial overwrites if backend overwrites
        preferences: { notifications }
      });
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleSavePassword = async () => {
    if (password.new !== password.confirm) {
      toast({
        title: 'Erro',
        description: 'As senhas não conferem.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
        await userService.changePassword({
            currentPassword: password.current,
            newPassword: password.new,
            confirmNewPassword: password.confirm
        });
        toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
        });
        setPassword({ current: '', new: '', confirm: '' });
    } catch (error: any) {
        toast({
        title: 'Erro ao alterar senha',
        description: error.response?.data?.message || 'Verifique sua senha atual.',
        variant: 'destructive',
        });
    }
    setIsLoading(false);
  };

  const handleSaveNotifications = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
        // We need to update the profile with the new preferences
        await userService.updateProfile(user.id, {
            name: profile.name,
            bio: profile.bio,
            phone: profile.phone,
            preferences: { notifications }
        });
        toast({
        title: 'Preferências salvas!',
        description: 'Suas notificações foram atualizadas.',
        });
    } catch (error) {
         toast({
        title: 'Erro',
        description: 'Não foi possível salvar as preferências.',
        variant: 'destructive',
        });
    }
    setIsLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Profile Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Perfil</CardTitle>
            </div>
            <CardDescription>
              Gerencie suas informações pessoais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="absolute bottom-0 right-0 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{user?.name}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
                <RoleBadge role={user?.role || 'Client'} className="mt-2" />
              </div>
            </div>

            <Separator />

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="premium" onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Salvar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Segurança</CardTitle>
            </div>
            <CardDescription>
              Altere sua senha de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password.new}
                  onChange={(e) => setPassword({ ...password, new: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleSavePassword}
                disabled={isLoading || !password.current || !password.new}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notificações</CardTitle>
            </div>
            <CardDescription>
              Configure como você deseja receber notificações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div>
              <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notificações por Email
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Atualizações de pedidos</p>
                    <p className="text-sm text-muted-foreground">
                      Receba emails quando houver mudanças no status dos pedidos.
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOrders}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailOrders: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Comentários</p>
                    <p className="text-sm text-muted-foreground">
                      Receba emails quando alguém comentar em seus pedidos.
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailComments}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailComments: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Newsletter e promoções</p>
                    <p className="text-sm text-muted-foreground">
                      Receba novidades e ofertas especiais.
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailMarketing}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailMarketing: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Push Notifications */}
            <div>
              <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações Push
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Alertas de pedidos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificações em tempo real sobre seus pedidos.
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushOrders}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, pushOrders: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Novos comentários</p>
                    <p className="text-sm text-muted-foreground">
                      Alertas quando houver novos comentários.
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushComments}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, pushComments: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleSaveNotifications} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salvar Preferências
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Aparência</CardTitle>
            </div>
            <CardDescription>
              Personalize a interface do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Tema escuro</p>
                <p className="text-sm text-muted-foreground">
                  Ative o modo escuro para reduzir o cansaço visual.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;
