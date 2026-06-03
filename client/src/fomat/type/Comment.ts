

export default interface Comment {
  id: string
  userID: string
  fullname: string
  avatar?: string
  text: string
  created_at: string
  likes: number
  isLiked: boolean
  parentId?: string // For reply comments
  replies?: Comment[] // Child replies
}















