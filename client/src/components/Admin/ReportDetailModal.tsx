 

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import type { Report } from  "../../fomat/adminType/adminPageTypes"

interface ReportDetailModalProps {
  report: Report
  onResolve: (reportId: string, action: string, note: string) => void
  onClose: () => void
}

export default function ReportDetailModal({ report, onResolve, onClose }: ReportDetailModalProps) {
  const [action, setAction] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!action) return

    setSubmitting(true)
    try {
      await onResolve(report._id, action, note)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 px-6 py-4 border-b border-[#404040] bg-[#252525] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#e5e7eb]">Report Details</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-[#333333] rounded transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">Report ID</p>
              <p className="font-mono text-sm text-[#e5e7eb]">{report._id}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">Status</p>
              <p className="text-sm text-[#e5e7eb] capitalize">{report.status}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">Target Type</p>
              <p className="text-sm text-[#e5e7eb] capitalize">{report.targetType}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">Reason</p>
              <p className="text-sm text-[#e5e7eb] capitalize">{report.reason.replace(/_/g, " ")}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">Reporter ID</p>
              <p className="font-mono text-sm text-[#e5e7eb]">{report.reporterId}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-[#9ca3af] uppercase mb-1">Target ID</p>
              <p className="font-mono text-sm text-[#e5e7eb]">{report.targetId}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-[#9ca3af] uppercase mb-2">Description</p>
            <p className="text-sm text-[#9ca3af] bg-[#252525] p-3 rounded-lg">{report.description}</p>
          </div>

          {/* Previous Action */}
          {report.adminAction && (
            <div className="bg-[#252525] border border-[#404040] rounded-lg p-4">
              <p className="text-sm font-semibold text-[#e5e7eb] mb-3">Admin Action Taken</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[#9ca3af]">Action</p>
                  <p className="text-[#e5e7eb] capitalize">{report.adminAction.action}</p>
                </div>
                <div>
                  <p className="text-[#9ca3af]">Date</p>
                  <p className="text-[#e5e7eb]">{new Date(report.adminAction.actionAt).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[#9ca3af]">Note</p>
                  <p className="text-[#e5e7eb]">{report.adminAction.note}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resolution Form */}
          {report.status !== "resolved" && (
            <form onSubmit={handleSubmit} className="border-t border-[#404040] pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#e5e7eb] mb-2">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] focus:outline-none focus:border-[#3b82f6]"
                >
                  <option value="">Select an action...</option>
                  <option value="delete">Delete Content</option>
                  <option value="hide">Hide Content</option>
                  <option value="warn">Warn User</option>
                  <option value="temp_ban">Temporary Ban</option>
                  <option value="ban">Permanent Ban</option>
                  <option value="ignore">Ignore Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e5e7eb] mb-2">Admin Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Document your decision..."
                  className="w-full px-3 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6] h-20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] hover:bg-[#333333] transition-colors disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || !action}
                  className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-50 font-medium"
                >
                  {submitting ? "Resolving..." : "Resolve Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
