import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import CommentItem from "./CommentItem"
import { X, Send, Heart, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FaShare } from "react-icons/fa"
import axios from "axios"
import type React from "react"
import type Post from "../../../../fomat/type/Post"
import type Comment from "../../../../fomat/type/Comment"

interface CommentsOverlayProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
  onUpdateComments: (postId: string, newComment: Comment) => void
}

export type ReplyState = {
  isReply: boolean
  replyingTo: string | null
  replyText: string | null
  replyTofullname: string | null
  parrentComment: string | null
}

export default function CommentsOverlay({
  post,
  isOpen,
  onClose,
  onUpdateComments,
}: CommentsOverlayProps) {
  const createEmptyComment = (): Comment => ({
    id: "",
    userId: "",
    fullname: "",
    avatar: "",
    text: "",
    time: "",
    likes: 0,
    isLiked: false,
    parentId: undefined,
    replies: [],
  })

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState<Comment>(createEmptyComment())
  const [isLikedPost, setIsLikedPost] = useState<boolean>(post?.isLiked ?? false)
  const [commentsCount, setCommentsCount] = useState<number>(post?.commentCount || 0)
  const [loadingComments, setLoadingComments] = useState<boolean>(false)

  const [replyState, setReplyState] = useState<ReplyState>({
    isReply: false,
    replyingTo: null,
    replyText: null,
    replyTofullname: null,
    parrentComment: null,
  })

  useEffect(() => {
    if (!post) return
    setIsLikedPost(post.isLiked || false)
    setCommentsCount(post.commentCount || 0)
    fetchComments(post.id)
  }, [post])

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(true)
      const token = localStorage.getItem("token")
      const res = await axios.get(`http://localhost:3000/melody/post/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      // setComments(res.data)
      onUpdateComments(post?.id, res.data)
    } catch (err) {
      console.error("Lỗi khi lấy comment:", err)
    } finally {
      setLoadingComments(false)
    }
  }

  const postCommentAPI = async (postId: string, comment: Comment, token: string) => {
    const res = await axios.post(
      `http://localhost:3000/melody/post/${postId}/add-comment`,
      comment,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return res.data.comment
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment?.text.trim() && post) {
      try {
        const token = localStorage.getItem("token") || ""
        await postCommentAPI(post.id, newComment, token)
        await fetchComments(post.id)
        setNewComment(createEmptyComment())
        setCommentsCount((prev) => prev + 1)
      } catch (err) {
        console.error("Lỗi gửi bình luận:", err)
      }
    }
  }

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full h-full max-h-[80vh] flex overflow-hidden">
        <div className="bg-black flex items-center aspect-square max-w-[50vw] justify-center border-r-5 border-black">
          <img
            src={post.image || "/placeholder.svg"}
            alt={`Post by ${post.fullname}`}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-[40vw] flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-start flex-1 gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.avatar || "/placeholder.svg"} />
                <AvatarFallback>{post.fullname[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{post.fullname}</span> {post.caption}
                </p>
                <p className="text-xs text-gray-500 mt-1">{post.time}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingComments ? (
              <p className="text-center text-gray-500">Đang tải bình luận...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-400">Chưa có bình luận nào</p>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id || uuidv4()}
                  postId={post.id}
                  comment={comment}
                  replyState={replyState}
                  setReplyState={setReplyState}
                />
              ))
            )}
          </div>

          <form onSubmit={handleSubmitComment} className="p-4 border-t">
            <div className="flex items-center gap-4 mb-3">
              <Button
                size="sm"
                className="p-0"
                onClick={() => setIsLikedPost(!isLikedPost)}
              >
                <Heart
                  size={24}
                  color={isLikedPost ? "red" : "black"}
                  fill={isLikedPost ? "red" : "white"}
                />
              </Button>
              <Button variant="ghost" size="sm" className="p-0">
                <MessageCircle size={24} />
              </Button>
              <Button variant="ghost" size="sm" className="p-0">
                <FaShare />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Thêm bình luận..."
                value={newComment?.text}
                onChange={(e) =>
                  setNewComment({
                    id: uuidv4(),
                    userId: "me",
                    fullname: "Tôi",
                    avatar: "",
                    text: e.target.value,
                    time: new Date().toLocaleTimeString(),
                    likes: 0,
                    isLiked: false,
                    replies: [],
                  })
                }
                className="flex-1 border-0 focus-visible:ring-0 px-0"
              />
              <Button type="submit" variant="ghost" size="sm" disabled={!newComment?.text.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
