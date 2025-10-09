

export default interface Comment {
  id: string
  userId: string
  fullname: string
  avatar?: string
  text: string
  time: string
  likes: number
  isLiked: boolean
  parentId?: string // For reply comments
  replies?: Comment[] // Child replies
}















