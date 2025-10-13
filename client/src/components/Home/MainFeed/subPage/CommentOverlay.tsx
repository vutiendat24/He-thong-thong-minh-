import { useEffect, useState } from "react"
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

  const [newComment, setNewComment] = useState<Comment>(createEmptyComment())
  const [isLikedPost, setIsLikedPost] = useState<boolean>(post?.isLiked ?? false)
  const [commentsCount, setCommentsCount] = useState<number>(post?.commentCount || 0)

  const { getComments, addReply, updateLikePost } = usePostContext()

  // ❌ Bỏ state comments, dùng trực tiếp từ context
  const comments = post ? getComments(post.id) : []

  const [replyState, setReplyState] = useState<ReplyState>({
    isReply: false,
    replyingTo: null,
    replyText: null,
    replyTofullname: null,
    parrentComment: null,
  })

  useEffect(() => {
    if (post) {
      setCommentsCount(post?.commentCount || 0)
      setIsLikedPost(post.isLiked || false)
    }
  }, [post])

  if (!isOpen || !post) return null

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment?.text.trim()) {
      setCommentsCount(commentsCount + 1)
      // gọi callback để cập nhật component cha (HomePage)
      onUpdateComments(post.id, newComment)
      setNewComment(createEmptyComment()) // reset lại form
    }
  }

  const handleSubmitReplyComment = (
    e: React.FormEvent,
    postId: string,
    CommenParrentId: string,
    replyComment: Comment
  ): void => {
    e.preventDefault()
    if (newComment?.text.trim()) {
      setCommentsCount(commentsCount + 1)
      addReply(postId, CommenParrentId, replyComment)
      setNewComment(createEmptyComment())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full h-full max-h-[80vh] flex overflow-hidden">
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
              <CommentItem
                key={comment.id}
                postId={post.id}
                comment={comment}
                replyState={replyState}
                setReplyState={setReplyState}
              />
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
