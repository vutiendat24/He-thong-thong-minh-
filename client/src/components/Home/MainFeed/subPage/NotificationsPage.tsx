
import type { NotificationData } from "@/fomat/type/Notification";
import { NotificationProvider, useNotification } from "@/context/NotificationContext";
import { useSocketContext } from "@/context/SocketContext";


import { Bell, Heart, MessageCircle, User, ArrowLeft } from 'lucide-react';
import { useState } from "react";

const NotificationsPage: React.FC = () => {
  const {socket} = useSocketContext()
  console.log("socketaaa", socket)
  const { notifications, markAsRead } = useNotification();
  const [currentView, setCurrentView] = useState<'notifications' | 'post'>('notifications');
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [highlightCommentId, setHighlightCommentId] = useState<string | undefined>();

  const onNotificationClick = (notification: NotificationData) => {
    if (notification.type === 'like' && notification.postId) {
      setSelectedPostId(notification.postId);
      setHighlightCommentId(undefined);
      setCurrentView('post');
    } else if (notification.type === 'comment' && notification.postId) {
      setSelectedPostId(notification.postId);
      setHighlightCommentId(notification.commentId);
      setCurrentView('post');
    }
  };
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes}ph`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}ng`;
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
  };

  const handleNotificationClick = (notification: NotificationData) => {
    socket?.emit("test",{})

    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Điều hướng dựa trên loại thông báo
    if (notification.type === 'like' || notification.type === 'comment') {
      onNotificationClick(notification);
    }
    // Follow không cần điều hướng đến post
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <User className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-white">
      <div className="p-4 lg:p-8">
        <h2 className="text-xl font-semibold mb-6">Thông báo</h2>
        <div className="space-y-0">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50' : ''
                }`}
            >
              <div className="relative flex-shrink-0">
                <div className={`relative overflow-hidden rounded-full bg-gray-200 h-10 w-10`}>
                  <img
                    src={notif.senderAvatar}
                    alt={notif.senderName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
                  {getNotificationIcon(notif.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-gray-900">{notif.senderName}</span>{' '}
                  <span className="text-gray-600">{notif.message}</span>
                </p>

                {notif.commentContent && (
                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    "{notif.commentContent}"
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-0.5">{formatTime(notif.createdAt)}</p>
              </div>

              {notif.postImage && (
                <img
                  src={notif.postImage}
                  alt="Post"
                  className="w-11 h-11 rounded object-cover flex-shrink-0"
                />
              )}

              {!notif.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default NotificationsPage