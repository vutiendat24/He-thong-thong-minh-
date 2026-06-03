 

import { useState } from "react"
import { X, Lock, Unlock, MessageSquareOff, AlertTriangle, History, FileText, MessageSquare } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/types/admin"
import { useAdmin } from "@/lib/admin-context"
import { mockPosts, mockComments, mockAdminActions } from "@/lib/mock-data"

interface UserDetailModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (userId: string, action: string, data?: any) => void
}

export function UserDetailModal({ user, open, onOpenChange, onAction }: UserDetailModalProps) {
  const { hasPermission } = useAdmin()
  const [actionReason, setActionReason] = useState("")
  const [suspendDays, setSuspendDays] = useState("7")

  if (!user) return null

  const userPosts = mockPosts.filter((p) => p.authorId === user._id)
  const userComments = mockComments.filter((c) => c.authorId === user._id)
  const userAuditLogs = mockAdminActions.filter((a) => a.targetId === user._id)

  const handleAction = (action: string) => {
    onAction(user._id, action, { reason: actionReason, suspendDays })
    setActionReason("")
    onOpenChange(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "locked":
        return "destructive"
      case "suspended":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>View user information and take moderation actions</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
              <AvatarFallback className="text-lg">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{user.username}</h3>
                <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                <span>Warnings: {user.warningCount}</span>
                <span>Can Comment: {user.canComment ? "Yes" : "No"}</span>
              </div>
              {user.banUntil && (
                <p className="mt-1 text-sm text-destructive">
                  Banned until: {new Date(user.banUntil).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts" className="gap-2">
                <FileText className="h-4 w-4" />
                Posts ({userPosts.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({userComments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                History ({userAuditLogs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4 space-y-3">
              {userPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No posts found</p>
              ) : (
                userPosts.map((post) => (
                  <div key={post._id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          post.status === "published"
                            ? "default"
                            : post.status === "removed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {post.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm line-clamp-2">{post.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{post.reportCount} reports</p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-4 space-y-3">
              {userComments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments found</p>
              ) : (
                userComments.map((comment) => (
                  <div key={comment._id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={comment.visible ? "default" : "secondary"}>
                        {comment.visible ? "Visible" : "Hidden"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm line-clamp-2">{comment.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{comment.reportCount} reports</p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-3">
              {userAuditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No moderation history</p>
              ) : (
                userAuditLogs.map((action) => (
                  <div key={action._id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{action.actionType}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(action.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">By: {action.admin?.username}</p>
                    {action.reason && <p className="mt-1 text-sm text-muted-foreground">Reason: {action.reason}</p>}
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Actions */}
          {hasPermission(["admin", "superadmin"]) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="action-reason">Action Reason</Label>
                <Textarea
                  id="action-reason"
                  placeholder="Enter reason for action..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={2}
                />
              </div>

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
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                {user.status === "active" ? (
                  <Button variant="destructive" size="sm" onClick={() => handleAction("lock")}>
                    <Lock className="mr-2 h-4 w-4" />
                    Lock Account
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleAction("unlock")}>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock Account
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 bg-transparent"
                  onClick={() => handleAction("suspend")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Suspend
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 bg-transparent"
                  onClick={() => handleAction("warning")}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Send Warning
                </Button>

                {user.canComment ? (
                  <Button variant="outline" size="sm" onClick={() => handleAction("disable_comment")}>
                    <MessageSquareOff className="mr-2 h-4 w-4" />
                    Disable Comments
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleAction("enable_comment")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Enable Comments
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
