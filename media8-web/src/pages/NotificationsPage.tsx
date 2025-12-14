import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Package, Info, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications, Notification } from '@/contexts/NotificationsContext';
import { cn } from '@/lib/utils';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'order':
      return Package;
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'order':
      return 'text-primary bg-primary/10 border-primary/20';
    case 'success':
      return 'text-success bg-success/10 border-success/20';
    case 'warning':
      return 'text-warning bg-warning/10 border-warning/20';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Ontem';
    } else {
      groupKey = format(date, "d 'de' MMMM", { locale: ptBR });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </motion.div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-6"
        >
          {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <motion.div key={date} variants={fadeInUp}>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">{date}</h2>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {dateNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colorClass = getNotificationColor(notification.type);

                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          'w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-4',
                          !notification.read && 'bg-primary/5'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border',
                            colorClass
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p
                                className={cn(
                                  'font-medium',
                                  notification.read ? 'text-muted-foreground' : 'text-foreground'
                                )}
                              >
                                {notification.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {notification.message}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {!notification.read && (
                                <Badge variant="default" className="text-xs">
                                  Nova
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                          </div>

                          {notification.link && (
                            <p className="text-xs text-primary mt-2">Clique para ver detalhes →</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma notificação</h3>
              <p className="text-muted-foreground">
                Quando você receber notificações, elas aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default NotificationsPage;
