 

import { AlertTriangle, Users, FileText, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { mockDashboardStats, mockReports } from "@/lib/mock-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function OverviewPage() {
  const stats = mockDashboardStats
  const pendingReports = mockReports.filter((r) => r.status === "pending")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reports Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportsToday}</div>
          
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contentUnderReview}</div>
           
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Locked Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lockedUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportsThisWeek}</div>
            
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Reports by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Reports by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.reportsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { weekday: "short" })}
                    className="text-muted-foreground"
                  />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#22c55e",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Reports by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Reports by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.reportsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="type"
                    label={({ type, percent=10 }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.reportsByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#22c55e",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Reported & Pending Reports */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Reported Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Reported Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topReportedUsers.map((item, index) => (
                <div key={item.user._id} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={item.user.avatar || "/placeholder.svg"} alt={item.user.username} />
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.user.username}</p>
                    <p className="text-xs text-muted-foreground">{item.user.email}</p>
                  </div>
                  <Badge variant="destructive">{item.count} reports</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingReports.slice(0, 5).map((report) => (
                <div key={report._id} className="flex items-center gap-4">
                  <Badge
                    variant={
                      report.targetType === "post"
                        ? "default"
                        : report.targetType === "comment"
                          ? "secondary"
                          : "outline"
                    }
                    className="w-20 justify-center"
                  >
                    {report.targetType}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{report.reason}</p>
                    <p className="text-xs text-muted-foreground">Reported by {report.reporter?.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
