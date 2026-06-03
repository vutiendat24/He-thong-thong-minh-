

import { useEffect, useState } from "react"
import StatsCard from "../../components/Admin/StatsCard"
import WeeklyStatsChart from "../../components/Admin/WeeklyStatsChart"
import PieChart from "../../components/Admin/PieChart"
import type { DailyStats, WeeklyStats } from "../../fomat/adminType/adminPageTypes"
import axios from "axios"

export default function Dashboard() {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalReportInWeek, setTotalReportInWeek] = useState(100)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [daily, weekly] = await Promise.all([axios.get("http://localhost:3000/melody/admin/daily",{
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }), 
        axios.get("http://localhost:3000/melody/admin/weekly",{
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        })])
        setDailyStats(daily.data[0])

        setWeeklyStats(weekly.data)
        // setDailyStats({
        //   "_id": "daily_2025_12_23",
        //   "newUsers": 1,
        //   "totalUsers": 10,
        //   "totalPosts": 410,
        //   "reportsToday": 87,
        //   "reportByReason": {
        //     "spam": 40,
        //     "hate_speech": 15,
        //     "nudity": 10,
        //     "violence": 8,
        //     "other": 5,
        //     "toxic": 5,
        //     "severe_toxic": 5,
        //     "obscene": 0,
        //     "threat": 0,
        //     "insult": 5,
        //     "identity_hate": 5,
        //     "fake_news": 0,
        //   },
        //   "createdAt": new Date("2025-12-23T00:00:00.000Z")
        // },)
        // setWeeklyStats([
        //   {
        //     _id: "d",
        //     date: "2025-12-20",
        //     totalPosts: 420,
        //     newUsers: 110,
        //     reportsToday: 90
        //   },
        //   {
        //     _id: "d",
        //     date: "2025-12-21",
        //     totalPosts: 380,
        //     newUsers: 95,
        //     reportsToday: 75
        //   },
        //   {
        //     _id: "d",
        //     date: "2025-12-22",
        //     totalPosts: 450,
        //     newUsers: 120,
        //     reportsToday: 85
        //   },
        //   {
        //     _id: "d",
        //     date: "2025-12-23",
        //     totalPosts: 390,
        //     newUsers: 100,
        //     reportsToday: 70
        //   },
        //   {
        //     _id: "d",
        //     date: "2025-12-24",
        //     totalPosts: 410,
        //     newUsers: 105,
        //     reportsToday: 80
        //   },
        //   {
        //     _id: "d",
        //     date: "2025-12-25",
        //     totalPosts: 350,
        //     newUsers: 85,
        //     reportsToday: 65
        //   },
        //   {
        //     _id: "d",
        //     date: "2025-12-26",
        //     totalPosts: 430,
        //     newUsers: 115,
        //     reportsToday: 88
        //   }
        // ])
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-[#9ca3af]">Loading statistics...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#e5e7eb] mb-8">TỔNG QUAN HỆ THỐNG  </h1>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard label="Tổng số người dùng" value={dailyStats?.totalUsers || 0} />
        <StatsCard label="Người dùng mới hôm nay " value={dailyStats?.newUsers || 0} />
        <StatsCard label="Báo cáo hôm nay " value={dailyStats?.reportsToday || 0} highlight="danger" />
        <StatsCard label="Báo cáo trong tuần" value={weeklyStats.reduce((sum, item) => sum + item.reportsToday, 0)|| 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2  rounded-lg border border-[#404040] p-6">
          <WeeklyStatsChart data={weeklyStats} />
        </div>

        <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] p-6">
          <h2 className="text-lg font-semibold text-[#e5e7eb] mb-4">THỐNG KÊ BÁO CÁO </h2>
          
          <PieChart
            data={[
              // { name: "Lời nói căm thù", value: dailyStats?.reportByReason.hate_speech || 0 },
              { name: "Spam", value: dailyStats?.reportByReason.spam || 0 },
              { name: "Bạo lực ", value: dailyStats?.reportByReason.violence || 0 },
              { name: "Tin Giả ", value: dailyStats?.reportByReason.fake_news || 0 },
              { name: "Khác", value: dailyStats?.reportByReason.other || 0 },
              { name: "Độc hại ", value: dailyStats?.reportByReason.toxic || 0 },
              { name: "Độc hại quá khích ", value: dailyStats?.reportByReason.severe_toxic || 0 },
              { name: "Tục tĩu ", value: dailyStats?.reportByReason.obscene || 0 },
              { name: "Đe dọa ", value: dailyStats?.reportByReason.threat || 0 },
              { name: "Sỉ nhục ", value: dailyStats?.reportByReason.insult || 0 },
              { name: "Thù địch ", value: dailyStats?.reportByReason.identity_hate || 0 },

            ]}
          />
        </div>
      </div>
    </div>
  )
}
