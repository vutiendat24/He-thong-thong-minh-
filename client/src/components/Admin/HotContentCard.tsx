 

import { Flame, AlertTriangle } from "lucide-react"
import type { Post } from  "../../fomat/adminType/adminPageTypes"

import {formatDateTime} from "../../lib/utils"

interface HotContentItemData {
  _id: string
  post: Post
  engagement_score: number
  reportCount: number
  isReported: boolean
  reports: Array<{
    reason: string
    count: number
  }>
}

interface HotContentCardProps {
  item: HotContentItemData
  onDelete: () => void
}

export default function HotContentCard({ item,  onDelete }: HotContentCardProps) {
  const { post, engagement_score, reportCount, isReported, reports } = item

  return (
    <div
      className={`rounded-lg border overflow-hidden hover:border-[#5a5a5a] transition-colors ${
         "bg-[#1a1a1a] border-[#404040]"
      }`}
    >
      {/* Header */}
      <div
        className={`px-6 py-4 border-b "border-[#404040] bg-[#252525]"}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-[#f59e0b]" />
            <span className="text-s font-semibold text-[#f59e0b] uppercase">Bài Viết Nổi Bật </span>
            {isReported && (
              <span className="text-s font-bold text-red-700 ml-2 flex items-center gap-1">
                <AlertTriangle size={12} />
                Bị báo cáo 
              </span>
            )}
          </div>
          {/* <span className="text-s text-[#6b7280]">{new Date(post.createdAt).toLocaleDateString()}</span> */}
          <span className="text-s text-[#6b7280]">{formatDateTime(post.createdAt)}</span>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-s font-medium text-[#e5e7eb]">Đăng bởi: {post.authorName}</h3>
            <h3 className="text-s italic font-medium text-[#2f72f7]">ID người dùng: {post.userID}</h3>
            <div className="flex gap-4 text-s text-[#6b7280] mt-1">
              <span>👍 {post.likeCount} Thích</span>
              <span>💬 {post.commentCount} Bình luận </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-[#f59e0b]">{engagement_score.toFixed(1)}</div>
            <div className="text-s text-[#6b7280]">Điểm tương tác </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {post.image && (
          <div className="mb-4 rounded-lg overflow-hidden bg-[#252525] aspect-video">
            <img src={post.image || "/placeholder.svg"} alt="Post" className="w-full h-full object-cover" />
          </div>
        )}

        <p className="text-s text-[#9ca3af] leading-relaxed mb-4 line-clamp-3">{post.caption}</p>

        {/* Report Info */}
        {isReported && (
          <div className="mb-4 p-3 bg-[#5f2f2f] border border-[#7f3f2f] rounded-lg">
            <p className="text-s font-medium text-[#fbbf24] mb-2">Số lượng báo cáo:  {reportCount} </p>
            <div className="space-y-1">
              {reports.map((r, i) => (
                <div key={i} className="flex justify-start gap-2 text-s">
                  <span className="text-[#fca5a5]">{r.reason.replace(/_/g, " ")}</span>
                  <span className="text-[#fca5a5] font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-[#404040] flex gap-3 bg-[#252525]">
   
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#7f1d1d] hover:bg-[#991b1b] text-[#fca5a5] rounded-lg transition-colors text-s font-medium"
        >
           Xử lý
        </button>
      </div>
    </div>
  )
}
