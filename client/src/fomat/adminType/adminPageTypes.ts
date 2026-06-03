export interface User {
  _id: string
  username: string
  avatar?: string
  email: string
  role: "user" | "admin"
  status: "active" | "warning" | "temp_banned" | "banned"
  banUntil: Date | null
  warningCount: number
  createdAt: Date
  lastLoginAt: Date
}

export interface Post {
  _id: string
  authorName: string
  userID: string
  image: string
  caption: string
  likeCount: number
  commentCount: number
  post_type: string
  status: "active" | "hidden" | "deleted"
  reportCount: number
  engagement_score: number
  createdAt: Date
}

export interface Comment {
  _id: string
  authorName: string
  userID: string
  text: string
  status: "active" | "hidden" | "deleted"
  reportCount: number
  createdAt: Date
}

export interface Report {
  _id: string
  reporterId: string
  targetType: "post" | "comment" | "user"
  targetId: string
  reason: "hate_speech" | "spam" | "nudity" | "violence" | "fake_news" | "other"

  
  description: string
  status: "pending" | "reviewing" | "resolved" | "rejected"
  createdAt: Date
  resolvedAt: Date | null
  adminAction?: {
    adminId: string
    action: "delete" | "hide" | "warn" | "temp_ban" | "ban" | "ignore"
    note: string
    actionAt: Date
  }
}

export interface DailyStats {
  _id: string
  newUsers: number
  totalUsers: number
  totalPosts: number
  reportsToday: number
  reportByReason: {
    hate_speech: number
    spam: number
    nudity: number
    violence: number
    fake_news: number
    other: number
    toxic: number
    severe_toxic: number
    obscene: number
    threat: number
    insult: number
    identity_hate: number
  }
  createdAt: Date
}

export interface WeeklyStats {
  _id: string
  date: string;
  totalPosts: number;
  newUsers: number;
  reportsToday: number;
}
