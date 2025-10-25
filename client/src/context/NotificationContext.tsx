import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { NotificationData } from '@/fomat/type/Notification';
import { useSocket } from '@/hooks/useSocket';
import { useSocketContext } from './SocketContext';






interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  addNotification: (notification: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([
    {
      id: '1',
      type: 'like',
      senderId: 'user2',
      senderName: 'Nguyễn Văn A',
      senderAvatar: 'https://i.pravatar.cc/150?img=1',
      postId: 'post1',
      postImage: 'https://picsum.photos/400/400?random=1',
      message: 'đã thích bài viết của bạn',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: '2',
      type: 'comment',
      senderId: 'user3',
      senderName: 'Trần Thị B',
      senderAvatar: 'https://i.pravatar.cc/150?img=2',
      postId: 'post1',
      postImage: 'https://picsum.photos/400/400?random=1',
      commentId: 'comment1',
      message: 'đã bình luận về bài viết của bạn',
      commentContent: 'Bài viết rất hay! 🔥',
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: '3',
      type: 'follow',
      senderId: 'user4',
      senderName: 'Lê Văn C',
      senderAvatar: 'https://i.pravatar.cc/150?img=3',
      message: 'đã bắt đầu theo dõi bạn',
      isRead: true,
      createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    {
      id: '4',
      type: 'comment',
      senderId: 'user5',
      senderName: 'Phạm Thị D',
      senderAvatar: 'https://i.pravatar.cc/150?img=4',
      postId: 'post2',
      postImage: 'https://picsum.photos/400/400?random=2',
      commentId: 'comment2',
      message: 'đã bình luận về bài viết của bạn',
      commentContent: 'Chụp ảnh đẹp quá 📸',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    },
  ]);

  const addNotification = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const {socket} = useSocketContext()

  useEffect(() => {
    if (!socket) return; // socket chưa sẵn sàng
    console.log("Listening to socket for notifications...");

    const handleNotification = (data: NotificationData) => {
      addNotification(data);
    };

    socket.on("new-notification", handleNotification);

    return () => {
      socket.off("new-notification", handleNotification);
    };
  }, [socket]); // chạy lại khi socket thay đổi
  


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













