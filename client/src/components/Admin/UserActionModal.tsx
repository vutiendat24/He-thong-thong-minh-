 

import type React from "react"

import { useState } from "react"
import type { User } from  "../../fomat/adminType/adminPageTypes"

interface UserActionModalProps {
  user: User
  actionType: "warn" | "temp_ban" | "ban" | "un_ban"
  onConfirm: (userId: string, action: string, days?: number, reason?: string) => void
  onClose: () => void
}

export default function UserActionModal({ user, actionType, onConfirm, onClose }: UserActionModalProps) {
  const [days, setDays] = useState(7)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onConfirm(user._id, actionType, actionType === "temp_ban" ? days : undefined, reason)
    } finally {
      setSubmitting(false)
    }
  }

  const getTitle = () => {
    switch (actionType) {
      case "warn":
        return "Gửi cảnh báo"
      case "temp_ban":
        return "Tạm khóa "
      case "ban":
        return "Khóa vĩnh viễn"
      case "un_ban":
        return "Mở khóa"
    }
  }

  const getDescription = () => {
    switch (actionType) {
      case "warn":
        return `Gửi cảnh cáo đến  ${user.username} `
      case "temp_ban":
        return `Tạm khóa người dùng ${user.username} trong vài ngày `
      case "ban":
        return `Ban vĩnh viễn người dùng ${user.username}. `
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] max-w-md w-full">
        <div className="px-6 py-4 border-b border-[#404040]">
          <h2 className="text-lg font-bold text-[#e5e7eb]">{getTitle()}</h2>
          <p className="text-sm text-[#9ca3af] mt-1">{getDescription()}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {actionType === "temp_ban" && (
            <div>
              <label className="block text-sm font-medium text-[#e5e7eb] mb-2">Chọn số lượng ngày khóa:  </label>
              <input
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(Number.parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#e5e7eb] mb-2">Lý do </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vui lòng nhập lý do..."
              className="w-full px-3 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6] h-24"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] hover:bg-[#333333] transition-colors disabled:opacity-50"
            >
              Hủy 
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors disabled:opacity-50 font-medium"
            >
              {submitting ? "Đang xử lý ..." : "Xác nhận "}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
