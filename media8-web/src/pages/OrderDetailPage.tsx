import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  Calendar,
  User,
  Clock,
  ExternalLink,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Edit,
  Upload,
  Link as LinkIcon,
  FileX,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAuth } from '@/contexts/AuthContext';
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select';
import CancelOrderButton from '@/components/orders/CancelOrderButton';
import { useToast } from '@/hooks/use-toast';
import { OrderStatus, OrderTimeline, TimelineActionType } from '@/types/api';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';

// Timeline is stored in-memory per session (will be replaced with API later)
const OrderDetailPage: React.FC = () => {
const { id } = useParams();
const navigate = useNavigate();
const { user } = useAuth();
const { toast } = useToast();

// Fetch real order data
const { data: order, isLoading, error } = useOrder(id);
const updateStatusMutation = useUpdateOrderStatus();

  // Fetch cancellation window from settings
  const { data: cancellationWindowHours } = useQuery({
    queryKey: ['settings', 'CancellationWindowHours'],
    queryFn: () => orderService.getCancellationWindow(),
  });

const [newComment, setNewComment] = useState('');
const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);
const [sessionTimeline, setSessionTimeline] = useState<OrderTimeline[]>([]);

// Set initial status when order loads
React.useEffect(() => {
if (order && newStatus === null) {
setNewStatus(order.status);
}
}, [order, newStatus]);

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    
    const newEntry: OrderTimeline = {
      id: `temp-${Date.now()}`,
      orderId: id!,
      userId: user.Id,
      actionType: 'Comment',
      content: newComment,
      timestamp: new Date().toISOString(),
    };
    
    setSessionTimeline(prev => [...prev, newEntry]);
    toast({
      title: 'Comentário adicionado!',
      description: 'Seu comentário foi enviado.',
    });
    setNewComment('');
  };

  const handleUpdateStatus = () => {
    if (!id || !newStatus || newStatus === order?.status) return;
    
    updateStatusMutation.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          // Add status change to timeline
          const newEntry: OrderTimeline = {
            id: `temp-${Date.now()}`,
            orderId: id,
            userId: user?.Id || '',
            actionType: 'StatusChange',
            content: `Status alterado para "${getStatusLabel(newStatus)}"`,
            timestamp: new Date().toISOString(),
          };
          setSessionTimeline(prev => [...prev, newEntry]);
        }
      }
    );
  };

  const handleApprove = () => {
    if (!id) return;
    updateStatusMutation.mutate(
      { id, status: 'Approved' },
      {
        onSuccess: () => {
          setNewStatus('Approved');
          const newEntry: OrderTimeline = {
            id: `temp-${Date.now()}`,
            orderId: id,
            userId: user?.Id || '',
            actionType: 'StatusChange',
            content: 'Vídeo aprovado pelo cliente',
            timestamp: new Date().toISOString(),
          };
          setSessionTimeline(prev => [...prev, newEntry]);
        }
      }
    );
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      Pending: 'Pendente',
      InProgress: 'Em Progresso',
      InReview: 'Em Revisão',
      ChangesRequested: 'Alterações Solicitadas',
      Approved: 'Aprovado',
    };
    return labels[status];
  };

  const getTimelineIcon = (actionType: TimelineActionType) => {
    switch (actionType) {
      case 'StatusChange':
        return <AlertCircle className="h-4 w-4" />;
      case 'Comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'VersionUpload':
        return <Upload className="h-4 w-4" />;
    }
  };

  const getTimelineColor = (actionType: TimelineActionType) => {
    switch (actionType) {
      case 'StatusChange':
        return 'bg-info/10 text-info border-info/30';
      case 'Comment':
        return 'bg-muted text-muted-foreground border-border';
      case 'VersionUpload':
        return 'bg-success/10 text-success border-success/30';
    }
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="p-4 rounded-full bg-muted mb-4">
          <FileX className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Pedido não encontrado
        </h2>
        <p className="text-muted-foreground mb-6">
          O pedido #{id} não existe ou foi removido.
        </p>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para Pedidos
        </Button>
      </motion.div>
    );
  }

  // Combine initial timeline (empty for new orders) with session timeline
  const allTimeline = [...sessionTimeline];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{order.title}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Pedido #{order.id} • Criado em {format(new Date(order.createdAt), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Briefing */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Briefing do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-foreground bg-muted/50 p-4 rounded-lg">
                    {order.briefing}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timeline / Comments */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Timeline do Projeto
                </CardTitle>
                <CardDescription>
                  Histórico de atualizações e comentários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Timeline */}
                <div className="space-y-4 mb-6">
                  {allTimeline.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma atualização ainda</p>
                      <p className="text-xs">Comentários e mudanças de status aparecerão aqui</p>
                    </div>
                  ) : (
                    allTimeline.map((entry, index) => {
                      const isComment = entry.actionType === 'Comment';
                      const isCurrentUser = entry.userId === user?.Id;

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex gap-4 ${isComment ? 'items-start' : 'items-center'}`}
                        >
                          <div className={`p-2 rounded-lg border ${getTimelineColor(entry.actionType)}`}>
                            {getTimelineIcon(entry.actionType)}
                          </div>
                          <div className="flex-1">
                            {isComment ? (
                              <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-foreground text-sm">
                                    {isCurrentUser ? 'Você' : 'Editor'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(entry.timestamp), "dd MMM 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                                <p className="text-foreground text-sm">{entry.content}</p>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-foreground">{entry.content}</p>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(entry.timestamp), "dd MMM 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                <Separator className="my-6" />

                {/* Add Comment */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Adicionar comentário</h4>
                  <Textarea
                    placeholder="Escreva seu comentário ou feedback..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="premium"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-4 w-4" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Prazo</span>
                  </div>
                  <span className="font-medium text-foreground text-sm">
                    {format(new Date(order.deadline), "dd 'de' MMM", { locale: ptBR })}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Editor</span>
                  </div>
                  <span className="font-medium text-foreground text-sm">
                    {order.editor?.name || 'Não atribuído'}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Criado em</span>
                  </div>
                  <span className="font-medium text-foreground text-sm">
                    {format(new Date(order.createdAt), "dd/MM/yy", { locale: ptBR })}
                  </span>
                </div>
                {order.serviceType && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="h-4 w-4" />
                        <span className="text-sm">Serviço</span>
                      </div>
                      <span className="font-medium text-foreground text-sm">
                        {order.serviceType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Links */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Links do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href={order.sourceFilesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-muted/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-info/10">
                    <LinkIcon className="h-4 w-4 text-info" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                      Arquivos Fonte
                    </p>
                    <p className="text-xs text-muted-foreground">Google Drive</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                {order.finalVideoUrl && (
                  <a
                    href={order.finalVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-success/20 bg-success/5 hover:bg-success/10 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-success/10">
                      <Video className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm group-hover:text-success transition-colors">
                        Vídeo Final
                      </p>
                      <p className="text-xs text-muted-foreground">Frame.io</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-success transition-colors" />
                  </a>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Alterar Status</label>
                  <Select value={newStatus || order.status} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pendente</SelectItem>
                      <SelectItem value="InProgress">Em Progresso</SelectItem>
                      <SelectItem value="InReview">Em Revisão</SelectItem>
                      <SelectItem value="ChangesRequested">Alterações</SelectItem>
                      <SelectItem value="Approved">Aprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
<Button
variant="outline"
className="w-full"
onClick={handleUpdateStatus}
disabled={!newStatus || newStatus === order.status || updateStatusMutation.isPending}
>
<Edit className="h-4 w-4" />
Atualizar Status
</Button>

{order.status === 'InReview' && (
<Button
variant="premium"
className="w-full"
onClick={handleApprove}
disabled={updateStatusMutation.isPending}
>
<CheckCircle2 className="h-4 w-4" />
Aprovar Vídeo
</Button>
)}

{/* Cancel Order Button (Client only, with timer) */}
{user?.Role === 'Client' && (order.status === 'Draft' || order.status === 'Pending') && (
<CancelOrderButton
orderId={order.id}
createdAt={order.createdAt}
cancellationWindowHours={cancellationWindowHours}
onSuccess={() => navigate('/orders')}
/>
)}
</CardContent>
</Card>
</motion.div>
</div>
</div>
</motion.div>
);
};

export default OrderDetailPage;
