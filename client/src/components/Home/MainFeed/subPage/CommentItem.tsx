import { useState } from "react"
import { Heart } from "lucide-react"
import { usePostContext } from "../../../../context/PostContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type Comment from "../../../../fomat/type/Comment"
import type { ReplyState } from "./CommentOverlay"
import { Button } from "@/components/ui/button"

export default function CommentItem({
  postId,
  comment,
  setReplyState,
}: {
  postId: string
  comment: Comment
  replyState: ReplyState
  setReplyState: React.Dispatch<React.SetStateAction<ReplyState>>
}) {
  const [expanded, setExpanded] = useState(false)
  const { updateLikeComment } = usePostContext()

  return (
    <div className="flex items-start text-start gap-3">
      {/* Avatar */}
      <div className="h-8 w-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
        {comment.avatar ? (
          <img src={comment.avatar} alt={comment.fullname} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold">{comment.fullname.toUpperCase()}</span>
        )}
      </div>

      {/* Nội dung comment */}
      <div className="flex-1 flex flex-col justify-start items-start">
        <p className={`text-sm break-all ${expanded ? "" : "line-clamp-2"}`}>
          <span className="font-semibold text-start">{comment.fullname}</span> {comment.text}
        </p>

        {/* Nút "Xem thêm / Thu gọn" */}
        {comment.text.length > 80 && (
          <p
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 hover:underline cursor-pointer mt-1"
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </p>
        )}

        {/* Info */}
        <div className="flex items-center gap-4 mt-1">
          <p className="text-xs text-gray-500">{comment.time}</p>
          <p className="text-xs text-gray-500 hover:text-gray-700">{comment.likes} lượt thích</p>
          <p
            className="text-xs cursor-pointer text-gray-500 hover:text-gray-700"
            onClick={() =>
              setReplyState({
                isReply: true,
                parrentComment: comment.id,
                replyingTo: comment.userId,
                replyTofullname: comment.fullname,
                replyText: "",
              })
            }
          >
            Trả lời
          </p>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={reply.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{reply.fullname[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{reply.fullname}</span> {reply.text}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-muted-foreground">{reply.time}</p>
                    <p
                      onClick={() =>
                        setReplyState({
                          isReply: true,
                          replyingTo: reply.id,
                          replyText: "",
                          replyTofullname: reply.fullname,
                          parrentComment: comment.id,
                        })
                      }
                      className="text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      Trả lời
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Like button */}
      <Button
        size="sm"
        className="p-0"
        onClick={() => updateLikeComment(postId, comment.id)}
      >
        <Heart
          size={24}
          color={comment.isLiked ? "red" : "black"}
          fill={comment.isLiked ? "red" : "white"}
        />
      </Button>
    </div>
  )
}
