 

import type React from "react"

import { useState } from "react"
import { Flame } from "lucide-react"
import type { Post } from  "../../fomat/adminType/adminPageTypes"

interface HotContentItem {
  _id: string
  post: Post
  engagement_score: number
}

interface HotContentActionModalProps {
  content: HotContentItem
  actionType: "hide" | "delete"
  onConfirm: (contentId: string, action: string, reason?: string) => void
  onClose: () => void
}

export default function HotContentActionModal({ content, actionType, onConfirm, onClose }: HotContentActionModalProps) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onConfirm(content._id, actionType, reason)
    } finally {
      setSubmitting(false)
    }
  }

  const actionLabel = actionType === "hide" ? "Hide" : "Delete"
  const actionColor = actionType === "hide" ? "bg-[#4b5563]" : "bg-[#7f1d1d]"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] max-w-md w-full">
        <div className="px-6 py-4 border-b border-[#404040] bg-[#252525]">
          <div className="flex items-center gap-3 mb-2">
            <Flame size={20} className="text-[#f59e0b]" />
            <h2 className="text-lg font-bold text-[#e5e7eb]">{actionLabel} Hot Content</h2>
          </div>
          <p className="text-sm text-[#9ca3af]">
            {actionType === "hide"
              ? "This trending content will be hidden from the platform."
              : "This trending content will be permanently deleted. This action cannot be reversed."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#e5e7eb] mb-2">Internal Note (Required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this hot content is being removed..."
              className="w-full px-3 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6] h-20"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] hover:bg-[#333333] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              className={`flex-1 px-4 py-2 ${actionColor} text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 font-medium`}
            >
              {submitting ? "Processing..." : actionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
