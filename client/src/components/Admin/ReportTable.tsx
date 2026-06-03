 

import { ChevronRight } from "lucide-react"
import type { Report } from  "../../fomat/adminType/adminPageTypes"
interface ReportTableProps {
  reports: Report[]
  onSelectReport: (report: Report) => void
}

export default function ReportTable({ reports, onSelectReport }: ReportTableProps) {
  const getStatusBadge = (status: string) => {
    const baseClass = "px-3 py-1 rounded-full text-xs font-medium"
    switch (status) {
      case "pending":
        return <span className={`${baseClass} bg-[#5f2f1f] text-[#fbbf24]`}>Pending</span>
      case "reviewing":
        return <span className={`${baseClass} bg-[#3f3f5f] text-[#93c5fd]`}>Reviewing</span>
      case "resolved":
        return <span className={`${baseClass} bg-[#064e3b] text-[#86efac]`}>Resolved</span>
      case "rejected":
        return <span className={`${baseClass} bg-[#3f3f3f] text-[#9ca3af]`}>Rejected</span>
      default:
        return <span className={`${baseClass} bg-[#252525] text-[#9ca3af]`}>{status}</span>
    }
  }

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      hate_speech: "text-[#ef4444]",
      spam: "text-[#f59e0b]",
      nudity: "text-[#8b5cf6]",
      violence: "text-[#dc2626]",
      fake_news: "text-[#f97316]",
      other: "text-[#6b7280]",
    }
    return colors[reason] || "text-[#9ca3af]"
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-[#404040]">
        <p className="text-[#9ca3af]">No reports found</p>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#404040] bg-[#252525]">
            <th className="px-6 py-4 text-left text-[#9ca3af] font-semibold">Reporter</th>
            <th className="px-6 py-4 text-left text-[#9ca3af] font-semibold">Target</th>
            <th className="px-6 py-4 text-left text-[#9ca3af] font-semibold">Reason</th>
            <th className="px-6 py-4 text-left text-[#9ca3af] font-semibold">Status</th>
            <th className="px-6 py-4 text-left text-[#9ca3af] font-semibold">Reported</th>
            <th className="px-6 py-4 text-right text-[#9ca3af] font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr
              key={report._id}
              onClick={() => onSelectReport(report)}
              className="border-b border-[#404040] hover:bg-[#252525] transition-colors cursor-pointer"
            >
              <td className="px-6 py-4">
                <span className="text-xs font-mono text-[#9ca3af] truncate block">
                  {report.reporterId.slice(0, 8)}...
                </span>
              </td>
              <td className="px-6 py-4">
                <div>
                  <p className="text-xs font-mono text-[#9ca3af]">{report.targetType}</p>
                  <p className="text-xs text-[#6b7280] mt-1 truncate">{report.targetId.slice(0, 12)}...</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`text-xs font-medium capitalize ${getReasonColor(report.reason)}`}>
                  {report.reason.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
              <td className="px-6 py-4 text-[#9ca3af] text-xs">{new Date(report.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-right">
                <ChevronRight size={18} className="text-[#6b7280]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
