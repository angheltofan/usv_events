import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/notificationService';
import { Notification, NotificationType } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUnreadCount: (count: number) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose, onUpdateUnreadCount }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await notificationService.getNotifications(1, 10);
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    onUpdateUnreadCount(Math.max(0, notifications.filter(n => !n.isRead).length - 1));

    await notificationService.markAsRead(notification.id);
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    onUpdateUnreadCount(0);
    await notificationService.markAllAsRead();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case NotificationType.EVENT_REMINDER:
        return <span className="text-xl">⏰</span>;
      case NotificationType.EVENT_UPDATE:
        return <span className="text-xl">ℹ️</span>;
      case NotificationType.REGISTRATION_CONFIRMED:
        return <span className="text-xl">✅</span>;
      case NotificationType.EVENT_CANCELLED:
        return <span className="text-xl">❌</span>;
      case NotificationType.EVENT_STATUS_CHANGE:
        return <span className="text-xl">📊</span>;
      case NotificationType.FEEDBACK_REQUEST:
        return <span className="text-xl">⭐</span>;
      default:
        return <span className="text-xl">🔔</span>;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Acum câteva secunde';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min în urmă`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ore în urmă`;
    return date.toLocaleDateString('en-GB');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="absolute right-0 top-14 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in origin-top-right">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Notificări</h3>
          {notifications.some(n => !n.isRead) && (
            <button 
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
            >
              Marchează toate citite
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {loading ? (
             <div className="p-4 text-center text-gray-400 text-sm">Se încarcă...</div>
          ) : notifications.length === 0 ? (
             <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                <span className="text-3xl mb-2">🔕</span>
                <p className="text-sm">Nu ai notificări noi.</p>
             </div>
          ) : (
             notifications.map(n => (
               <div 
                 key={n.id} 
                 onClick={() => handleMarkAsRead(n)}
                 className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex gap-3 ${!n.isRead ? 'bg-indigo-50/50' : 'bg-white'}`}
               >
                  <div className="mt-1 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1">
                    <p className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></div>
                  )}
               </div>
             ))
          )}
        </div>
        
        {notifications.length > 0 && (
             <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                 <button className="text-xs text-gray-500 hover:text-gray-800 font-medium">Vezi tot istoricul</button>
             </div>
        )}
      </div>
    </>
  );
};