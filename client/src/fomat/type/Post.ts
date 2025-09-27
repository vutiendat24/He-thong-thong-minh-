


export default interface Post {
  id: string
  userId: string
  username: string
  avatar?: string
  image: string
  caption?: string
  likes: number
  commentCount: number
  isLiked: boolean
  time: string
}