 

import { useState } from "react"
import { Eye, Trash2, Ban, AlertTriangle, Filter, Search, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockReports } from "@/lib/mock-data"
import { ReportDetailModal } from "../../../components/Admin2/report-detail-modal"
import type { Report, ReportStatus, ReportTargetType } from "../../../lib/types"
import { useAdmin } from "@/lib/admin-context"

export default function ReportsPage() {
  const { hasPermission } = useAdmin()
  const [reports, setReports] = useState<Report[]>(mockReports)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filteredReports = reports.filter((report) => {
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    const matchesType = typeFilter === "all" || report.targetType === typeFilter
    const matchesSearch =
      searchQuery === "" ||
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporter?.username.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

  const handleViewReport = (report: Report) => {
    setSelectedReport(report)
    setModalOpen(true)
  }

  const handleReportAction = (reportId: string, action: string, reason?: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r._id === reportId) {
          if (action === "approve" || action === "reject") {
            return { ...r, status: action === "approve" ? "reviewed" : ("rejected" as ReportStatus) }
          }
        }
        return r
      }),
    )
  }

  const getStatusBadgeVariant = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return "destructive"
      case "reviewed":
        return "default"
      case "rejected":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getTypeBadgeVariant = (type: ReportTargetType) => {
    switch (type) {
      case "post":
        return "default"
      case "comment":
        return "secondary"
      case "user":
        return "outline"
      default:
        return "outline"
    }
  }

  const pendingCount = reports.filter((r) => r.status === "pending").length
  const reviewedCount = reports.filter((r) => r.status === "reviewed").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports Management</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{reviewedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by reason or reporter..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow >
                {/* <TableHead>Reporter</TableHead> */}
                <TableHead>Target</TableHead>
                <TableHead className="text-center max-w-15">Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-center max-w-15" >Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell className="flex items-center text-bold gap-1  text-left max-w-40" >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={"https://res.cloudinary.com/dsfgzdr5z/image/upload/v1763543050/pmkb13ga7sac2bliy5sq.jpg"} />
                    </Avatar>

                    <span className=" m-0 p-0 text-m text-black font-bold ">{report.targetName.slice(0, 20)}</span>
                  </TableCell>
                  <TableCell className="text-center max-w-15  ">
                    <Badge variant={getTypeBadgeVariant(report.targetType)}>{report.targetType}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-left line-clamp-1 max-w-[500px] text-sm">{report.reason}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(report.status)}>{report.status}</Badge>
                  </TableCell>
                  <TableCell className="text-left max-w-15">

                    <span className="text-sm text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewReport(report)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {report.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleReportAction(report._id, "approve")}>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Mark Reviewed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReportAction(report._id, "reject")}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {hasPermission(["admin", "superadmin"]) && (
                          <DropdownMenuItem className="text-destructive">
                            <Ban className="mr-2 h-4 w-4" />
                            Lock User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAction={handleReportAction}
      />
    </div>
  )
}
