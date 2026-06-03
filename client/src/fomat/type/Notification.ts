


export interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'follow';
  receiverId: string,
  senderId: string;
  senderName: string;
  senderAvatar: string;
  postId?: string;
  postImage?: string;
  commentId?: string;
  message: string;
  commentContent?: string;
  isRead: boolean;
  createdAt: string;
}