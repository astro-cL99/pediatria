import { toast } from 'sonner';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
}

export function useNotifications() {
  const showNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
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
  };

  return { showNotification };
}
