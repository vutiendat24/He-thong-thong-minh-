// Admin Dashboard Types based on MongoDB schema

export type UserRole = "user" | "moderator" | "admin" | "superadmin"
export type UserStatus = "active" | "locked" | "suspended"
export type PostStatus = "published" | "removed" | "under_review"
export type ReportTargetType = "post" | "comment" | "user"
export type ReportStatus = "pending" | "reviewed" | "rejected"

export interface User {
  _id: string
  username: string
  email: string
  avatar?: string
  role: UserRole
  status: UserStatus
  banUntil?: Date
  canComment: boolean
  warningCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Post {
  _id: string
  authorId: string
  author?: User
  content: string
  status: PostStatus
  reportCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  _id: string
  postId: string
  authorId: string
  author?: User
  content: string
  visible: boolean
  reportCount: number
  createdAt: Date
}

export interface Report {
  _id: string
  reporterId: string
  reporter?: User
  targetType: ReportTargetType
  targetId: string
  targetName: string
  target?: Post | Comment | User
  reason: string
  status: ReportStatus
  createdAt: Date
}

export interface AdminAction {
  _id: string
  adminId: string
  admin?: User
  actionType: string
  targetType: ReportTargetType
  targetId: string
  reason?: string
  createdAt: Date
}

export interface ModerationPolicy {
  autoHideThreshold: number
  autoSuspendDays: number
  maxWarnings: number
  createdAt: Date
}

export interface DashboardStats {
  reportsToday: number
  reportsThisWeek: number
  contentUnderReview: number
  lockedUsers: number
  suspendedUsers: number
  topReportedUsers: { user: User; count: number }[]
  topReportedPosts: { post: Post; count: number }[]
  reportsByDay: { date: string; count: number }[]
  reportsByType: { type: string; count: number }[]
}
