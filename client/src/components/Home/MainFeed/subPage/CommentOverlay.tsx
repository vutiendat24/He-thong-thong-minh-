import { useEffect, useState, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import CommentItem from "./CommentItem"
import { usePostContext } from "../../../../context/PostContext"
import type React from "react"
import type Post from "../../../../fomat/type/Post"
import type Comment from "../../../../fomat/type/Comment"

import { X, Send, Heart, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FaShare } from "react-icons/fa"
import axios, { AxiosError } from "axios"


interface CommentsOverlayProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
  onUpdateComments: (postId: string, newComment: Comment) => void
  updateLikePost: (postID: string) => void
  commentID?: string // Thêm prop commentID tùy chọn
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
  updateLikePost,
  commentID, // Nhận commentID từ props
}: CommentsOverlayProps) {
  const createEmptyComment = (): Comment => ({
    id: "",
    userID: "",
    fullname: "",
    avatar: "",
    text: "",
    time: "",
    likes: 0,
    isLiked: false,
    parentId: undefined,
    replies: [],
  })
  
  if (!isOpen || !post) return null
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState<Comment>(createEmptyComment())
  const [isLikedPost, setIsLikedPost] = useState<boolean>(post?.isLiked ?? false)
  const [commentsCount, setCommentsCount] = useState<number>(post?.commentCount || 0)
  const [loadingComments, setLoadingComments] = useState<boolean>(false)
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const { addReply, handleTokenExpired } = usePostContext()
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

  // Hiệu ứng nhấp nháy khi có commentID
  useEffect(() => {
    if (commentID && comments.length > 0) {
      setHighlightedCommentId(commentID)
      
      // Sắp xếp comments: đưa comment được highlight lên đầu
      const sortedComments = [...comments]
      const highlightedIndex = sortedComments.findIndex(c => c.id === commentID)
      if (highlightedIndex > 0) {
        const [highlightedComment] = sortedComments.splice(highlightedIndex, 1)
        sortedComments.unshift(highlightedComment)
        setComments(sortedComments)
      }
      
      // Scroll đến đầu danh sách
      setTimeout(() => {
        const commentElement = commentRefs.current[commentID]
        if (commentElement) {
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
      
      // Tắt highlight sau 2 giây
      const timer = setTimeout(() => {
        setHighlightedCommentId(null)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [commentID, comments.length])

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(true)
      const token = localStorage.getItem("token")
      const res = await axios.get(`http://localhost:3000/melody/post/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.data.status === 401) {
        handleTokenExpired()
      }
      setComments(res.data.data[postId])
    } catch (err) {
      const error = err as AxiosError
      if (error.response?.status === 401) {
        handleTokenExpired()
      }
      console.error("Lỗi khi lấy comment:", err)
    } finally {
      setLoadingComments(false)
    }
  }

  const postCommentAPI = async (postId: string, comment: Comment, token: string) => {
    try {
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
      return res.data
    } catch (err) {
      const error = err as AxiosError
      if (error.response?.status === 401) {
        handleTokenExpired()
      }
    }
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
  
  const handleSubmitReplyComment = async (e: React.FormEvent, postId: string, parentCommentId: string, reply: Comment) => {
    addReply(postId, parentCommentId, reply)
    console.log("Da them binh luan ")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-7xl h-full max-h-[80vh] flex overflow-hidden">
        {/* Post Image */}
        <div className="bg-black flex items-center aspect-square max-w-[50vw] justify-center border-r-5 border-black">
          <img
            src={post.image || "/placeholder.svg"}
            alt={`Post by ${post.fullname}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Comments Section */}
        <div className="max-w-[40vw] flex flex-col">
          {/* Caption */}
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

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                ref={(el) => {
                  commentRefs.current[comment.id] = el
                }}
                className={`transition-all duration-300 ${
                  highlightedCommentId === comment.id
                    ? 'animate-pulse bg-yellow-100 p-2 rounded-lg'
                    : ''
                }`}
              >
                <CommentItem
                  postId={post.id}
                  comment={comment}
                  replyState={replyState}
                  setReplyState={setReplyState}
                />
              </div>
            ))}
          </div>

          {/* Add Comment */}
          {replyState.isReply ? (
            <form
              onSubmit={(e) =>
                handleSubmitReplyComment(e, post.id, replyState.parrentComment!, newComment!)
              }
              className="p-4 border-t"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-row">
                  <p>
                    Đang trả lời{" "}
                    {replyState.replyTofullname !== null ? (
                      <span className="inline-block text-blue-400 text-xl">
                        {replyState.replyTofullname}
                      </span>
                    ) : (
                      ""
                    )}
                  </p>
                </div>
                <div className="flex">
                  <Input
                    placeholder={
                      replyState.replyTofullname !== null
                        ? "Trả lời " + replyState.replyTofullname
                        : ""
                    }
                    value={newComment?.text}
                    onChange={(e) =>
                      setNewComment({
                        id: uuidv4(),
                        userID: "Tien Dat",
                        fullname: "ddd",
                        avatar: "",
                        text: e.target.value,
                        time: "10/5",
                        likes: 0,
                        isLiked: false,
                        parentId: replyState.parrentComment!,
                        replies: [],
                      })
                    }
                    className="flex-1 border-0 focus-visible:ring-0 px-0"
                  />
                  <Button type="submit" variant="ghost" size="sm" disabled={!newComment?.text.trim()}>
                    <Send size={16} />
                  </Button>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyState({
                        ...replyState,
                        isReply: false,
                      })
                    }
                    className="bg-red-600 text-amber-950"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitComment} className="p-4 border-t">
              <div className="flex items-center gap-4 mb-3">
                <Button
                  size="sm"
                  className="p-0"
                  onClick={() => {
                    updateLikePost(post.id)
                    setIsLikedPost(!isLikedPost)
                  }}
                >
                  <Heart
                    size={24}
                    color={isLikedPost === true ? "red" : "black"}
                    fill={isLikedPost === true ? "red" : "white"}
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
                      id: String(post.commentCount + 1),
                      userID: "Tien Dat",
                      fullname: "ddd",
                      avatar: "",
                      text: e.target.value,
                      time: "10/5",
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
          )}
        </div>
      </div>
    </div>
  )
}