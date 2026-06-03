interface StatsCardProps {
  label: string
  value: number | string
  trend?: string
  highlight?: "danger" | "success" | "default"
}

export default function StatsCard({ label, value, trend, highlight = "default" }: StatsCardProps) {
  const bgColor = highlight === "danger" ? "bg-[#7f1d1d]" : highlight === "success" ? "bg-[#064e3b]" : "bg-[#252525]"

  const textColor =
    highlight === "danger" ? "text-[#fca5a5]" : highlight === "success" ? "text-[#86efac]" : "text-[#60a5fa]"

  return (
    <div className={`${bgColor} rounded-lg border border-[#404040] p-4 flex flex-col`}>
      <p className="text-s font-bold text-[#9ca3af] uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold ${textColor} mb-1`}>{value}</p>
      {trend && <p className="text-xs text-[#6b7280]">{trend}</p>}
    </div>
  )
}
