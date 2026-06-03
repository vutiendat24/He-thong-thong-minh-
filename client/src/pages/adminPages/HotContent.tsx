import { useEffect, useState } from "react"
import { Flame, X } from "lucide-react"
import HotContentCard from "../../components/Admin/HotContentCard"
import type { Post } from "../../fomat/adminType/adminPageTypes"
import axios from "axios"

interface HotContentItem {
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

// Mock data for testing
const hotContentMock: HotContentItem[] = [
  {
    _id: "hot_001",
    post: {
      _id: "post_001",
      authorName: "Messi",
      userID: "user_001",
      image: "https://picsum.photos/600/400?1",
      caption: " Khoảnh khắc hoàng hôn tuyệt đẹp Khoảnh khắc hoàng hôn tuyệt đẹp Khoảnh khắc hoàng hôn tuyệt đẹp Khoảnh khắc hoàng hôn tuyệt đẹp Khoảnh khắc hoàng hôn tuyệt đẹp Khoảnh khắc hoàng hôn tuyệt đẹp Khoảnh khắc hoàng hôn tuyệt đẹp Khoảnh khắc hoàng hôn tuyệt đẹp Khoảnh khắc hoàng hôn tuyệt đẹp Khoảnh khắc hoàng hôn tuyệt đẹp 🌅",
      likeCount: 1200,
      commentCount: 180,
      post_type: "image",
      status: "active",
      reportCount: 2,
      engagement_score: 1450,
      createdAt: new Date("2025-12-20T10:00:00Z")
    },
    engagement_score: 1450,
    reportCount: 2,   
    isReported: true,
    reports: [
      { reason: "spam", count: 1 },
      { reason: "other", count: 1 },
    ]
  },
  {
    _id: "hot_002",
    post: {
      _id: "post_002",
      authorName: "user_002",
      userID: "user_002",
      image: "https://picsum.photos/600/400?2",
      caption: "Chuyến du lịch cuối năm ✈️",
      likeCount: 980,
      commentCount: 140,
      post_type: "image",
      status: "active",
      reportCount: 0,
      engagement_score: 1120,
      createdAt: new Date("2025-12-21T09:30:00Z")
    },
    engagement_score: 1120,
    reportCount: 0,
    isReported: false,
    reports: []
  },
  {
    _id: "hot_003",
    post: {
      _id: "post_003",
      authorName: "user_003",
      userID: "user_003",
      image: "https://picsum.photos/600/400?3",
      caption: "Món ăn tự nấu tại nhà 🍜",
      likeCount: 860,
      commentCount: 95,
      post_type: "image",
      status: "active",
      reportCount: 1,
      engagement_score: 955,
      createdAt: new Date("2025-12-22T12:15:00Z")
    },
    engagement_score: 955,
    reportCount: 1,
    isReported: true,
    reports: [
      { reason: "nudity", count: 1 }
    ]
  },
  {
    _id: "hot_004",
    post: {
      _id: "post_004",
      authorName: "user_004",
      userID: "user_004",
      image: "https://picsum.photos/600/400?4",
      caption: "Chạy bộ mỗi sáng 🏃‍♂️",
      likeCount: 740,
      commentCount: 80,
      post_type: "image",
      status: "active",
      reportCount: 0,
      engagement_score: 820,
      createdAt: new Date("2025-12-22T06:00:00Z")
    },
    engagement_score: 820,
    reportCount: 0,
    isReported: false,
    reports: []
  },
  {
    _id: "hot_005",
    post: {
      _id: "post_005",
      authorName: "user_005",
      userID: "user_005",
      image: "https://picsum.photos/600/400?5",
      caption: "Buổi hòa nhạc cuối tuần 🎶",
      likeCount: 690,
      commentCount: 120,
      post_type: "image",
      status: "active",
      reportCount: 3,
      engagement_score: 810,
      createdAt: new Date("2025-12-23T20:00:00Z")
    },
    engagement_score: 810,
    reportCount: 3,
    isReported: true,
    reports: [
      { reason: "hate_speech", count: 1 },
      { reason: "spam", count: 2 }
    ]
  },
  {
    _id: "hot_006",
    post: {
      _id: "post_006",
      authorName: "user_006",
      userID: "user_006",
      image: "https://picsum.photos/600/400?6",
      caption: "Thử thách thể thao mới 💪",
      likeCount: 620,
      commentCount: 70,
      post_type: "video",
      status: "active",
      reportCount: 0,
      engagement_score: 690,
      createdAt: new Date("2025-12-24T07:45:00Z")
    },
    engagement_score: 690,
    reportCount: 0,
    isReported: false,
    reports: []
  },
  {
    _id: "hot_007",
    post: {
      _id: "post_007",
      authorName: "user_007",
      userID: "user_007",
      image: "https://picsum.photos/600/400?7",
      caption: "Cuộc sống tối giản 🧘",
      likeCount: 580,
      commentCount: 65,
      post_type: "image",
      status: "active",
      reportCount: 1,
      engagement_score: 645,
      createdAt: new Date("2025-12-24T18:10:00Z")
    },
    engagement_score: 645,
    reportCount: 1,
    isReported: true,
    reports: [
      { reason: "other", count: 1 }
    ]
  },
  {
    _id: "hot_008",
    post: {
      _id: "post_008",
      authorName: "user_008",
      userID: "user_008",
      image: "https://picsum.photos/600/400?8",
      caption: "Chăm sóc thú cưng 🐶",
      likeCount: 520,
      commentCount: 60,
      post_type: "image",
      status: "active",
      reportCount: 0,
      engagement_score: 580,
      createdAt: new Date("2025-12-25T08:00:00Z")
    },
    engagement_score: 580,
    reportCount: 0,
    isReported: false,
    reports: []
  },
  {
    _id: "hot_009",
    post: {
      _id: "post_009",
      authorName: "user_009",
      userID: "user_009",
      image: "https://picsum.photos/600/400?9",
      caption: "Ảnh phong cảnh miền núi 🏔️",
      likeCount: 480,
      commentCount: 55,
      post_type: "image",
      status: "active",
      reportCount: 2,
      engagement_score: 535,
      createdAt: new Date("2025-12-25T09:20:00Z")
    },
    engagement_score: 535,
    reportCount: 2,
    isReported: true,
    reports: [
      { reason: "spam", count: 1 },
      { reason: "fake_news", count: 1 }
    ]
  },
  {
    _id: "hot_010",
    post: {
      _id: "post_010",
      authorName: "user_010",
      userID: "user_010",
      image: "https://picsum.photos/600/400?10",
      caption: "Một ngày làm việc hiệu quả ☕",
      likeCount: 450,
      commentCount: 50,
      post_type: "image",
      status: "active",
      reportCount: 0,
      engagement_score: 500,
      createdAt: new Date("2025-12-25T10:30:00Z")
    },
    engagement_score: 500,
    reportCount: 0,
    isReported: false,
    reports: []
  }
];

export default function HotContent() {
  const [content, setContent] = useState<HotContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<"all" | "reported" | "clean">("all")
  const [selectedContent, setSelectedContent] = useState<HotContentItem | null>(null)
  const [actionType, setActionType] = useState<"hide" | "delete" | null>(null)
  const [action, setAction] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchHotContent()
  }, [filterStatus])

  const fetchHotContent = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (filterStatus === "reported") params.has_reports = "true"
      if (filterStatus === "clean") params.has_reports = "false"

      const res = await axios.get("http://localhost:3000/melody/admin/hot-content")
      // Giả lập filter với mock data
      let filteredData = res.data
      if (filterStatus === "reported") {
        filteredData = hotContentMock.filter(item => item.isReported)
      } else if (filterStatus === "clean") {
        filteredData = hotContentMock.filter(item => !item.isReported)
      }

      setContent(filteredData)
    } catch (error) {
      console.error("Failed to fetch hot content:", error)
    } finally {
      setLoading(false)
    }
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
          await axios.delete(`/api/admin/posts/${selectedContent.post._id}`)
          console.log("Content deleted permanently")
          // Xóa khỏi danh sách hiện tại
          setContent(content.filter((c) => c._id !== contentId))
          break

        case "hide":
          // Ẩn content (soft delete)
          await axios.patch(`/api/admin/posts/${selectedContent.post._id}/status`, {
            status: "hidden",
            reason: reason
          })
          console.log("Content hidden")
          // Xóa khỏi danh sách hot content
          setContent(content =>content.filter((c) => c._id !== contentId))
          break

        case "warn":
          // Cảnh báo user
          await axios.post(`/api/admin/users/${selectedContent.post.userID}/warn`, {
            postId: selectedContent.post._id,
            reason: reason
          })
          console.log("User warned")
          // Giữ lại content, chỉ cập nhật trạng thái
          if (selectedContent.isReported) {
            await axios.patch(`/api/admin/reports/${contentId}/resolve`, {
              action: "warned",
              note: reason
            })
          }
          break

        case "temp_ban":
          // Tạm khóa tài khoản user (7 ngày)
          await axios.post(`/api/admin/users/${selectedContent.post.userID}/ban`, {
            duration: 7, // days
            reason: reason,
            postId: selectedContent.post._id
          })
          console.log("User temporarily banned")
          // Xóa tất cả content của user khỏi hot
          setContent(content.filter((c) => c.post.userID !== selectedContent.post.userID))
          break

        case "ban":
          // Khóa vĩnh viễn tài khoản user
          await axios.post(`/api/admin/users/${selectedContent.post.userID}/ban`, {
            permanent: true,
            reason: reason,
            postId: selectedContent.post._id
          })
          console.log("User permanently banned")
          // Xóa tất cả content của user
          setContent(content.filter((c) => c.post.userID !== selectedContent.post.userID))
          break

        case "ignore":
          // Bỏ qua report, đánh dấu là không vi phạm
          if (selectedContent.isReported) {
            await axios.patch(`/api/admin/reports/${contentId}/resolve`, {
              action: "ignored",
              note: reason
            })
            console.log("Report ignored")
            // Cập nhật trạng thái local
            setContent(content.map((c) => 
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

      // Đóng modal sau khi xử lý thành công
      closeModal()
      
      // Có thể thêm toast notification ở đây
      // toast.success(`Action "${action}" completed successfully`)

    } catch (error) {
      console.error(`Failed to perform action "${action}":`, error)
      // Có thể thêm toast error ở đây
      // toast.error(`Failed to ${action} content`)
    }
  }

  const closeModal = () => {
    setSelectedContent(null)
    setActionType(null)
    setAction("")
    setNote("")
  }

  const reportedContent = content.filter((c) => c.isReported)
  const cleanContent = content.filter((c) => !c.isReported)

  return (
    <>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="text-[#f59e0b]" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-[#e5e7eb]">BÀI VIẾT NỔI BẬT  </h1>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] p-4">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">TỔNG SỐ </p>
              <p className="text-2xl font-bold text-[#e5e7eb]">{content.length}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] p-4">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">BỊ BÁO CÁO </p>
              <p className="text-2xl font-bold text-[#f59e0b]">{reportedContent.length}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] p-4">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">BÌNH THƯỜNG </p>
              <p className="text-2xl font-bold text-[#10b981]">{cleanContent.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {[
              { value: "all", label: "Tất cả " },
              { value: "reported", label: "Bị báo cáo " },
              { value: "clean", label: "Bình thường " },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value as "all" | "reported" | "clean")}
                className={`px-4 py-2 rounded-lg text-s font-medium transition-all ${
                  filterStatus === filter.value
                    ? "bg-[#f59e0b] text-black border border-[#d97706]"
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
          <div className="text-center py-12 text-[#9ca3af]">Đang tải ..</div>
        ) : content.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-[#404040]">
            <Flame className="mx-auto text-[#6b7280] mb-3" size={40} />
            <p className="text-[#9ca3af] text-lg">Danh sách trống </p>
          </div>
        ) : (
          <>
            {/* Reported Content (Priority) */}
            {reportedContent.length > 0 && (
              <div className="mb-12">
               
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {reportedContent.map((item) => (
                    <HotContentCard
                      key={item._id}
                      item={item}
                      
                      onDelete={() => {
                        setSelectedContent(item)
                        setActionType("delete")
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Clean Content */}
            {cleanContent.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#e5e7eb] mb-4">Bài Viết Bình Thường </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {cleanContent.map((item) => (
                    <HotContentCard
                      key={item._id}
                      item={item}
                   
                      onDelete={() => {
                        setSelectedContent(item)
                        setActionType("delete")
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Modal - Separate overlay */}
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
                <p className="text-s font-medium text-[#e5e7eb]">{selectedContent.post.authorName}</p>
                <p className="text-xs text-[#9ca3af] mb-1">ID người dùng: {selectedContent.post.userID}</p>
              </div>
              
              {selectedContent.post.image && (
                <img 
                  src={selectedContent.post.image} 
                  alt="Content preview" 
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}
              
              <p className="text-s text-[#9ca3af] mb-3">{selectedContent.post.caption}</p>
              
              <div className="flex gap-4 text-xs text-[#6b7280]">
                <span>👍 {selectedContent.post.likeCount} Thích </span>
                <span>💬 {selectedContent.post.commentCount} Bình luận </span>
              </div>

              
            </div>

            {/* Action Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-s font-medium text-[#e5e7eb] mb-2">Hành động </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] focus:outline-none focus:border-[#3b82f6]"
                  required
                >
                  <option value="">Chọn hành động ...</option>
                  <option value="hide">Ẩn nội dung </option>
                  <option value="temp_ban">Tạm khóa (1 Tuần)</option>
                  <option value="ban">Khóa vĩnh viễn </option>
                  <option value="ignore">Bỏ qua (Không vi phạm)</option>
                </select>
              </div>

              <div>
                <label className="block text-s font-medium text-[#e5e7eb] mb-2">Ghi chú </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú ..."
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
                  {submitting ? "Đang Xử Lý..." : "Xác Nhận "}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}