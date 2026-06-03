 

import { EyeOff, Trash2 } from "lucide-react"
import type { Post, Comment } from "../../fomat/adminType/adminPageTypes"

interface ContentCardProps {
  item: {
    _id: string
    type: "post" | "comment"
    content: Post | Comment
    reportCount: number
    reasons: string[]
    latestReportDate: Date
  }
  onHide: () => void
  onDelete: () => void
}

export default function ContentCard({ item, onHide, onDelete }: ContentCardProps) {
  const isPost = item.type === "post"
  const post = item.content as Post
  const comment = item.content as Comment

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] overflow-hidden hover:border-[#5a5a5a] transition-colors">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#404040] bg-[#252525]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#60a5fa] uppercase">{item.type === "post" ? "Bài viết " : "Bình luận "}</span>
          <span className="text-xs text-[#6b7280]">{new Date(item.latestReportDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1">
          <h3 className="text-sm font-medium text-[#e5e7eb] ">
            {isPost ? "Bài viêt của " + post.authorName : "Bình luận của " + comment.authorName}
          </h3>
          <h3 className="text-sm font-medium text-[#e5e7eb] ">
            {isPost ? "ID người dùng: " + post.userID : "ID người dùng: "+ comment.userID}
          </h3>

          </div>
          <span className="px-3 py-1 bg-[#7f2f1f] text-[#fbbf24] rounded-full text-xs font-medium">
            {item.reportCount} Báo cáo 
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {isPost && post.image !== "" && (
          <div className="mb-4 rounded-lg overflow-hidden bg-[#252525] aspect-video">
            <img src={post.image || "/placeholder.svg"} alt="Post" className="w-full h-full object-cover" />
          </div>
        )}

        <p className="text-sm text-[#9ca3af] leading-relaxed mb-4 line-clamp-3">{isPost ? post.caption : comment.text}</p>

        {isPost && (
          <div className="flex gap-4 text-xs text-[#6b7280] pb-4 border-b border-[#404040]">
            <span>👍 {post.likeCount} likes</span>
            <span>💬 {post.commentCount} comments</span>
          </div>
        )}

        {/* Report Reasons */}
        <div className="mt-4 pt-4 border-t border-[#404040]">
          <p className="text-xs font-medium text-[#9ca3af] mb-2">Lý do:</p>
          <div className="flex flex-wrap gap-2">
            {item.reasons.map((reason, i) => (
              <span key={i} className="px-2 py-1 bg-[#3f2f2f] text-[#fca5a5] rounded text-xs">
                {reason.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-[#252525] border-t border-[#404040] flex gap-3">
        {/* <button
          onClick={onHide}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#4b5563] hover:bg-[#5a6575] text-[#e5e7eb] rounded-lg transition-colors text-sm font-medium"
        >
          <EyeOff size={16} />
          Hide
        </button> */}
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#7f1d1d] hover:bg-[#991b1b] text-[#fca5a5] rounded-lg transition-colors text-sm font-medium"
        >
          Xử lý 
        </button>
      </div>
    </div>
  )
}
