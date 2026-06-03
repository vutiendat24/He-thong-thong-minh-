
import type { NotificationData } from "@/fomat/type/Notification";
import { useNotification } from "@/context/NotificationContext";
import { useSocketContext } from "@/context/SocketContext";


import { Bell, Heart, MessageCircle, User, ArrowLeft } from 'lucide-react';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CommentsOverlay from "./CommentOverlay";
import type Post from "@/fomat/type/Post";
import axios from "axios";
import { usePostContext } from "@/context/PostContext";

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { notifications, markAsRead } = useNotification();
  const [postDetail, setPostDetail] = useState<Post | null>(null)
  const [isOpenCommentOverlay, setIsOpenCommentOverlay] = useState(false)
  const [highlightCommentId, setHighlightCommentId] = useState<string | undefined>();

    const { addComment, currrentUserId, updateLikePost, handleTokenExpired } = usePostContext()
    const handleOpenComment = (post: Post) => {
          setPostDetail(post)
          setIsOpenCommentOverlay(true)
      }
  
      const handleCloseComment = () => {
          setPostDetail(null)
          setIsOpenCommentOverlay(false)
      }
  const onNotificationClick = async (notification: NotificationData) => {
    await axios.post(`http://localhost:3000/melody/notify/read-notification/${notification.id}`,{}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
    if (notification.type === 'follow') {
      navigate(`/homePage/profile/${notification.senderId}`)
    } else {
      // lay chi tiet thong tin cua bai viet cua thong bao duoc chon 
      const apiRes = await axios.get(`http://localhost:3000/melody/post/get-post/${notification.postId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })

      if (apiRes.data.success === true) {
        setPostDetail(apiRes.data.data)
      }


      if (notification.type === 'like' && notification.postId) {
        setHighlightCommentId(undefined);
        setIsOpenCommentOverlay(true);
      } else if (notification.type === 'comment' && notification.postId) {
        setHighlightCommentId(notification.commentId);
        setIsOpenCommentOverlay(true);
      }
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
   

    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    onNotificationClick(notification);
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
  if (notifications.length === 0) {
    return (
      <div className="h-screen overflow-y-auto bg-white">
        <div className="p-4 lg:p-8">
          <h2 className="text-[40px] font-semibold mb-6">Thông báo</h2>
          <h2 className="text-l text-red-700 mb-6 italic ">Bạn không có thông báo nào</h2>

        </div>
      </div>
    )
  }
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

      {isOpenCommentOverlay && (
                      <CommentsOverlay
                          isOpen={isOpenCommentOverlay}
                          onClose={handleCloseComment}
                          post={postDetail}
                          onUpdateComments={addComment}
                          updateLikePost={updateLikePost}
                          commentID = {highlightCommentId}
                      />
                  )}
    </div>
  );
};


export default NotificationsPage