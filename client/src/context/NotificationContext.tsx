
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { NotificationData } from '@/fomat/type/Notification';
import { useSocketContext } from './SocketContext';
import axios from 'axios';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  addNotification: (notification: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const { socket } = useSocketContext();

  const baseURL = "http://localhost:3000/melody/notify";

  const addNotification = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const fetchNotifyData = async () => {
    try {
      const res = await axios.get(`${baseURL}/getNotifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.status === 200) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  // chay 1 lan de lay cac thong bao trong db
  // cac lan sau khi co thong bao moi se duoc cap nhat thong qua socket
  useEffect(()=>{
    fetchNotifyData();
  }, [])


  useEffect(() => {
    if (!socket) return;
    // Handle realtime notification
    const handleNotification = (data: NotificationData) => {
      console.log("📩 Client RECEIVED realtime notify:", data);
      addNotification(data);
    };

    socket.on("new-notification", handleNotification);

    // Cleanup
    return () => {
      socket.off("new-notification", handleNotification);
    };
  }, [socket]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
