interface PieDataPoint {
  name: string
  value: number
}

interface PieChartProps {
  data: PieDataPoint[]
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899","#ec4749","#ec4199"]

export default function PieChart({ data }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const slices = data.map((d, i) => {
    const percentage = (d.value / total) * 100
    return { ...d, percentage, color: COLORS[i % COLORS.length] }
  })

  let currentAngle = -Math.PI / 2
  const radius = 50
  const centerX = 50
  const centerY = 50

  const paths = slices.map((slice) => {
    const sliceAngle = (slice.percentage / 100) * 2 * Math.PI
    const endAngle = currentAngle + sliceAngle

    const x1 = centerX + radius * Math.cos(currentAngle)
    const y1 = centerY + radius * Math.sin(currentAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)

    const largeArc = sliceAngle > Math.PI ? 1 : 0

    const d = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ")

    const midAngle = currentAngle + sliceAngle / 2
    const labelRadius = radius * 0.65
    const labelX = centerX + labelRadius * Math.cos(midAngle)
    const labelY = centerY + labelRadius * Math.sin(midAngle)

    currentAngle = endAngle
    return { d, labelX, labelY, slice }
  })

  return (
    <div>
      <svg viewBox="0 0 100 100" className="w-full h-48">
        {paths.map((path, i) => (
          <path key={i} d={path.d} fill={path.slice.color} opacity="0.8" />
        ))}

        {paths.map((path, i) => {
          if (path.slice.percentage > 5) {
            return (
              <text
                key={i}
                x={path.labelX}
                y={path.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-bold fill-white"
              >
                {Math.round(path.slice.percentage)}%
              </text>
            )
          }
          return null
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 space-y-1">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-2 text-s">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div>
            <span className="text-[#ffffff] ">
              {slice.name} ({slice.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
