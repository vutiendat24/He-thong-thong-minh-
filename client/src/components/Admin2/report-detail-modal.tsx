 

import { useState } from "react"
import { X, Eye, Trash2, Ban, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Report, Post, Comment, User } from "../../lib/types"
import { useAdmin } from "@/lib/admin-context"

interface ReportDetailModalProps {
  report: Report | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (reportId: string, action: string, reason?: string) => void
}

export function ReportDetailModal({ report, open, onOpenChange, onAction }: ReportDetailModalProps) {
  const { hasPermission } = useAdmin()
  const [actionReason, setActionReason] = useState("")
  const [suspendDays, setSuspendDays] = useState("7")

  if (!report) return null

  const getTargetContent = () => {
    if (report.targetType === "post") {
      return (report.target as Post)?.content
    }
    if (report.targetType === "comment") {
      return (report.target as Comment)?.content
    }
    if (report.targetType === "user") {
      return `User: ${(report.target as User)?.username}`
    }
    return "Content not available"
  }

  const getTargetAuthor = () => {
    if (report.targetType === "user") {
      return report.target as User
    }
    return (report.target as Post | Comment)?.author
  }

  const author = getTargetAuthor()

  const handleAction = (action: string) => {
    onAction(report._id, action, actionReason || undefined)
    setActionReason("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report Detail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Info */}
           <span className="text-sm text-muted-foreground">Ngày báo cáo: {new Date(report.createdAt).toLocaleString()}</span>
           <p className="text-sm text-muted-foreground">Lý do: {report.reason}</p>
          

          <Separator />

          {/* Reported Content */}
          <div>
            <h4 className="mb-3 font-medium">Reported Content</h4>
            <div className="rounded-lg border border-border p-4">
              {author && (
                <div className="mb-3 flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={author.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{author.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{author.username}</p>
                    <p className="text-sm text-muted-foreground">{author.email}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto capitalize">
                    {author.status}
                  </Badge>
                </div>
              )}
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm">{getTargetContent()}</p>
              </div>
            </div>
          </div>

          {/* Action Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Action Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for your action..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Suspend Duration (for user reports) */}
          {report.targetType === "user" && hasPermission(["admin", "superadmin"]) && (
            <div className="space-y-2">
              <Label>Suspend Duration</Label>
              <Select value={suspendDays} onValueChange={setSuspendDays}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {/* View Content */}
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              View Original
            </Button>

            {/* Content Actions */}
            {(report.targetType === "post" || report.targetType === "comment") && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 bg-transparent"
                  onClick={() => handleAction("hide_content")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Hide Content
                </Button>
                {hasPermission(["admin", "superadmin"]) && (
                  <Button variant="destructive" size="sm" onClick={() => handleAction("remove_content")}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Content
                  </Button>
                )}
              </>
            )}

            {/* User Actions */}
            {hasPermission(["admin", "superadmin"]) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 bg-transparent"
                  onClick={() => handleAction("warning")}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Send Warning
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleAction("lock_user")}>
                  <Ban className="mr-2 h-4 w-4" />
                  Lock User
                </Button>
              </>
            )}

            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleAction("reject")}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Report
              </Button>
              <Button size="sm" onClick={() => handleAction("approve")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Reviewed
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
