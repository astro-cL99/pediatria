import { useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
}

export function useNotifications() {
  const { socket } = useApp();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    // Escuchar nuevas notificaciones
    const handleNewNotification = (notification: Notification) => {
      // Mostrar notificación al usuario
      switch (notification.type) {
        case 'success':
          toast.success(notification.title, { description: notification.message });
          break;
        case 'error':
          toast.error(notification.title, { description: notification.message });
          break;
        case 'warning':
          toast.warning(notification.title, { description: notification.message });
          break;
        default:
          toast(notification.title, { description: notification.message });
      }

      // Invalidar consultas relacionadas con notificaciones
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    };

    // Escuchar actualizaciones de datos
    const handleDataUpdated = (data: { entity: string; id: string }) => {
      // Invalidar consultas relacionadas con la entidad actualizada
      queryClient.invalidateQueries({ queryKey: [data.entity] });
      
      // Si es un paciente, también invalidar la lista de pacientes
      if (data.entity === 'patient') {
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      }
    };

    // Suscribirse a los eventos del socket
    socket.on('notification', handleNewNotification);
    socket.on('data:updated', handleDataUpdated);

    // Limpieza al desmontar
    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('data:updated', handleDataUpdated);
    };
  }, [socket, queryClient]);

  return null;
}
