 

import { useEffect, useState } from "react"
import axios from "axios"
import ContentCard from "../../components/Admin/ContentCard"
import ContentActionModal from "../../components/Admin/ContentActionModal"
import type { Post, Comment } from  "../../fomat/adminType/adminPageTypes"
import { X } from "lucide-react"

interface ContentItem {
  _id: string
  type: "post" | "comment"
  content: Post | Comment
  reportCount: number
  reasons: string[]
  latestReportDate: Date
}

export default function ContentModeration() {
  const contentItems: ContentItem[] = [
  {
    _id: "ci_001",
    type: "post",
    content: {
      _id: "post_001",
      authorName: "LA LA lA ",
      userID: "user_001",
      image: "https://res.cloudinary.com/dsfgzdr5z/image/upload/v1765076401/nt76nqmpxa8jmgd5qvll.jpg",
      caption: "Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi Bài viết có nội dung gây tranh cãi  ",
      likeCount: 120,
      commentCount: 35,
      post_type: "text",
      status: "active",
      reportCount: 0,
      engagement_score: 78,
      createdAt: new Date("2025-12-20T08:30:00Z")
    },
    reportCount: 5,
    reasons: ["hate_speech"],
    latestReportDate: new Date("2025-12-21T10:15:00Z")
  },
  {
    _id: "ci_002",
    type: "comment",
    content: {
      _id: "comment_001",
      authorName: "post_001",
      userID: "user_002",
      text: "Spam link quảng cáo",
      status: "active",
      reportCount: 12,
      createdAt: new Date("2025-12-21T09:10:00Z")
    },
    reportCount: 12,
    reasons: ["spam"],
    latestReportDate: new Date("2025-12-21T12:40:00Z")
  },
  {
    _id: "ci_003",
    type: "post",
    content: {
      _id: "post_002",
      authorName: "user_003",
      userID: "user_003",
      image: "https://res.cloudinary.com/dsfgzdr5z/image/upload/v1765076401/nt76nqmpxa8jmgd5qvll.jpg",
      caption: "Tin tức chưa được kiểm chứng",
      likeCount: 95,
      commentCount: 20,
      post_type: "news",
      status: "active",
      reportCount: 8,
      engagement_score: 65,
      createdAt: new Date("2025-12-19T14:00:00Z")
    },
    reportCount: 8,
    reasons: ["fake_news"],
    latestReportDate: new Date("2025-12-22T08:00:00Z")
  },
  {
    _id: "ci_004",
    type: "comment",
    content: {
      _id: "comment_002",
      authorName: "post_002",
      userID: "user_004",
      text: "Ngôn từ xúc phạm người khác",
      status: "active",
      reportCount: 20,
      createdAt: new Date("2025-12-20T16:20:00Z")
    },
    reportCount: 20,
    reasons: ["hate_speech"],
    latestReportDate: new Date("2025-12-22T18:10:00Z")
  },
  {
    _id: "ci_005",
    type: "post",
    content: {
      _id: "post_003",
      authorName: "user_005",
      userID: "user_005",
      image: "https://res.cloudinary.com/dsfgzdr5z/image/upload/v1765076401/nt76nqmpxa8jmgd5qvll.jpg",
      caption: "Hình ảnh không phù hợp",
      likeCount: 60,
      commentCount: 12,
      post_type: "image",
      status: "hidden",
      reportCount: 15,
      engagement_score: 40,
      createdAt: new Date("2025-12-18T11:45:00Z")
    },
    reportCount: 15,
    reasons: ["nudity"],
    latestReportDate: new Date("2025-12-23T09:30:00Z")
  },
  {
    _id: "ci_006",
    type: "comment",
    content: {
      _id: "comment_003",
      authorName: "post_003",
      userID: "user_006",
      text: "Bình luận kích động bạo lực",
      status: "hidden",
      reportCount: 9,
      createdAt: new Date("2025-12-22T07:00:00Z")
    },
    reportCount: 9,
    reasons: ["violence"],
    latestReportDate: new Date("2025-12-23T14:00:00Z")
  },
  {
    _id: "ci_007",
    type: "post",
    content: {
      _id: "post_004",
      authorName: "user_007",
      userID: "user_007",
      image: "https://example.com/img/4.jpg",
      caption: "Bài viết gây hiểu lầm cho người đọc",
      likeCount: 140,
      commentCount: 48,
      post_type: "text",
      status: "active",
      reportCount: 6,
      engagement_score: 85,
      createdAt: new Date("2025-12-21T13:30:00Z")
    },
    reportCount: 6,
    reasons: ["other"],
    latestReportDate: new Date("2025-12-24T10:10:00Z")
  },
  {
    _id: "ci_008",
    type: "comment",
    content: {
      _id: "comment_004",
      authorName: "post_004",
      userID: "user_008",
      text: "Spam bình luận hàng loạt",
      status: "deleted",
      reportCount: 18,
      createdAt: new Date("2025-12-23T20:15:00Z")
    },
    reportCount: 18,
    reasons: ["spam"],
    latestReportDate: new Date("2025-12-24T21:00:00Z")
  },
  {
    _id: "ci_009",
    type: "post",
    content: {
      _id: "post_005",
      authorName: "user_009",
      userID: "user_009",
      image: "",
      caption: "Nội dung nhạy cảm",
      likeCount: 70,
      commentCount: 18,
      post_type: "image",
      status: "hidden",
      reportCount: 11,
      engagement_score: 50,
      createdAt: new Date("2025-12-22T10:00:00Z")
    },
    reportCount: 11,
    reasons: ["nudity", "other"],
    latestReportDate: new Date("2025-12-25T08:45:00Z")
  },
  {
    _id: "ci_010",
    type: "comment",
    content: {
      _id: "comment_005",
      authorName: "post_005",
      userID: "user_010",
      text: "Bình luận công kích cá nhân",
      status: "active",
      reportCount: 22,
      createdAt: new Date("2025-12-24T15:30:00Z")
    },
    reportCount: 22,
    reasons: ["hate_speech"],
    latestReportDate: new Date("2025-12-25T16:00:00Z")
  }
];

  const [contents, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<"all" | "post" | "comment">("all")
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [actionType, setActionType] = useState<"hide" | "delete" | null>(null)
const [action, setAction] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    fetchContent()
  }, [filterType])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (filterType !== "all") params.type = filterType

      const response = await axios.get("http://localhost:3000/melody/admin/content-reported", { params })
      setContent(response.data)
    } catch (error) {
      console.error("Failed to fetch content:", error)
    } finally {
      setLoading(false)
    }
  }
   const closeModal = () => {
    setSelectedContent(null)
    setActionType(null)
    setAction("")
    setNote("")
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!action || !selectedContent) return

    setSubmitting(true)
    try {
      await handleAction(selectedContent._id, action, note)
    } finally {
      setSubmitting(false)
      setSelectedContent(null)
    }
  }

  const handleAction = async (contentId: string, action: string, reason?: string) => {
    try {
      if (!selectedContent) return

      // Xử lý từng action cụ thể
      switch (action) {
        case "delete":
          // Xóa content vĩnh viễn
          await axios.delete(`/api/admin/posts/${selectedContent.content._id}`)
          console.log("Content deleted permanently")
          // Xóa khỏi danh sách hiện tại
          contents.filter((c) => c._id !== contentId)
          break

        case "hide":
          // Ẩn content (soft delete)
          await axios.patch(`/api/admin/posts/${selectedContent.content._id}/status`, {
            status: "hidden",
            reason: reason
          })
          console.log("Content hidden")
          // Xóa khỏi danh sách hot content
          setContent(content =>content.filter((c) => c._id !== contentId))
          break

        case "warn":
          // Cảnh báo user
          // await axios.post(`/api/admin/users/${selectedContent.content.userID}/warn`, {
          //   authorName: selectedContent.content._id,
          //   reason: reason
          // })
          console.log("User warned")
          // Giữ lại content, chỉ cập nhật trạng thái
          // await axios.patch(`/api/admin/reports/${contentId}/resolve`, {
          //   action: "warned",
          //   note: reason
          // })
          
          break

        case "temp_ban":
          // Tạm khóa tài khoản user (7 ngày)
          await axios.post(`/api/admin/users/${selectedContent.content.userID}/ban`, {
            duration: 7, // days
            reason: reason,
            authorName: selectedContent.content._id
          })
          console.log("User temporarily banned")
          // Xóa tất cả content của user khỏi hot
          setContent(contents.filter((c) => c.content.userID !== selectedContent.content.userID))
          break

        case "ban":
          // Khóa vĩnh viễn tài khoản user
          await axios.post(`/api/admin/users/${selectedContent.content.userID}/ban`, {
            permanent: true,
            reason: reason,
            authorName: selectedContent.content._id
          })
          console.log("User permanently banned")
          // Xóa tất cả content của user
          setContent(contents.filter((c) => c.content.userID !== selectedContent.content.userID))
          break

        case "ignore":
          // Bỏ qua report, đánh dấu là không vi phạm
          if (selectedContent.reportCount) {
            await axios.patch(`/api/admin/reports/${contentId}/resolve`, {
              action: "ignored",
              note: reason
            })
            console.log("Report ignored")
            // Cập nhật trạng thái local
            setContent(contents.map((c) => 
              c._id === contentId 
                ? { ...c, isReported: false, reports: [], reportCount: 0 }
                : c
            ))
          }
          break

        default:
          console.error("Unknown action:", action)
          return
      }

      closeModal()
      

    } catch (error) {
      console.error(`Failed to perform action "${action}":`, error)
    }
  }

  const totalReports = contents?.reduce((sum, item) => sum + item.reportCount, 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#e5e7eb] mb-2">QUẢN LÝ BÁO CÁO   </h1>
        <p className="text-[#9ca3af]">
          GỒM {contents.length} NỘI DUNG 
        </p>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          {[
            { value: "all", label: "Tất cả " },
            { value: "post", label: "Bài viết" },
            { value: "comment", label: "Bình luận " },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterType(filter.value as "all" | "post" | "comment")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === filter.value
                  ? "bg-[#3b82f6] text-white border border-[#2563eb]"
                  : "bg-[#252525] text-[#9ca3af] border border-[#404040] hover:bg-[#333333]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#9ca3af]">Đang tải...</div>
      ) : contents.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-[#404040]">
          <p className="text-[#9ca3af] text-lg">Không có nội dung được báo cáo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contents.map((item) => (
            <ContentCard
              key={item._id}
              item={item}
              onHide={() => {
                setSelectedContent(item)
                setActionType("hide")
              }}
              onDelete={() => {
                setSelectedContent(item)
                setActionType("delete")
              }}
            />
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedContent && actionType && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#404040] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#e5e7eb]">
                  {actionType === "delete" ? "Delete Content" : "Hide Content"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Preview */}
            <div className="px-6 py-4 border-b border-[#404040]">
              <div className="mb-3">
                <p className="text-xs text-[#9ca3af] mb-1">Bài viết của </p>
                <p className="text-s font-medium text-[#e5e7eb]">{selectedContent.content.userID}</p>
              </div>
              
              {selectedContent.type === "post" && (selectedContent.content as Post).image && (
                <img 
                  src={(selectedContent.content as Post).image} 
                  alt="Content preview" 
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}
              
              <p className="text-s text-[#9ca3af] mb-3">{(selectedContent.content as Post).caption}</p>
              
              <div className="flex gap-4 text-xs text-[#6b7280]">
                <span>👍 {(selectedContent.content as Post).likeCount} thích </span>
                <span>💬 {(selectedContent.content as Post).commentCount} bình luận</span>
              </div>

              
            </div>

            {/* Action Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-s font-medium text-[#e5e7eb] mb-2">Hành động</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] focus:outline-none focus:border-[#3b82f6]"
                  required
                >
                  <option value="">Chọn hành động ...</option>
                  <option value="hide">Ẩn nội dung </option>
                  <option value="temp_ban">Tạm khóa (1 tuần) </option>
                  <option value="ban">Khóa vĩnh viễn </option>
                  <option value="ignore">Bỏ qua (Không có nội dung vi phạm)</option>
                </select>
              </div>

              <div>
                <label className="block text-s font-medium text-[#e5e7eb] mb-2">Ghi chú </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập nội dung..."
                  className="w-full px-3 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6] h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] hover:bg-[#333333] transition-colors disabled:opacity-50"
                >
                  Hủy 
                </button>
                <button
                  type="submit"
                  disabled={submitting || !action}
                  className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-50 font-medium"
                >
                  {submitting ? "Đang xử lý ..." : "Xác nhận "}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
