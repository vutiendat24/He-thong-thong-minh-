 

import { useState } from "react"
import { Search, Filter, MoreHorizontal, EyeOff, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { mockComments } from "@/lib/mock-data"
import type { Comment } from "../../../lib/types"

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>(mockComments)
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionReason, setActionReason] = useState("")

  const filteredComments = comments.filter((comment) => {
    const matchesVisibility =
      visibilityFilter === "all" ||
      (visibilityFilter === "visible" && comment.visible) ||
      (visibilityFilter === "hidden" && !comment.visible)
    const matchesSearch =
      searchQuery === "" ||
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.author?.username.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesVisibility && matchesSearch
  })

  const handleCommentAction = (commentId: string, action: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c._id === commentId) {
          switch (action) {
            case "hide":
              return { ...c, visible: false }
            case "restore":
              return { ...c, visible: true }
            default:
              return c
          }
        }
        return c
      }),
    )
    setModalOpen(false)
    setActionReason("")
  }

  const visibleCount = comments.filter((c) => c.visible).length
  const hiddenCount = comments.filter((c) => !c.visible).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comment Management</h1>
        <p className="text-muted-foreground">Manage and moderate user comments</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Visible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{visibleCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Hidden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{hiddenCount}</div>
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
                placeholder="Search by content or author..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comments List</CardTitle>
          <CardDescription>
            {filteredComments.length} comment{filteredComments.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comment</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.map((comment) => (
                <TableRow key={comment._id}>
                  <TableCell>
                    <span className="line-clamp-2 max-w-[300px] text-sm">{comment.content}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={comment.author?.avatar || "/placeholder.svg"}
                          alt={comment.author?.username}
                        />
                        <AvatarFallback>{comment.author?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{comment.author?.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={comment.visible ? "default" : "secondary"}>
                      {comment.visible ? "Visible" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${comment.reportCount > 0 ? "text-amber-600 font-medium" : ""}`}>
                      {comment.reportCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedComment(comment)
                            setModalOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {comment.visible ? (
                          <DropdownMenuItem onClick={() => handleCommentAction(comment._id, "hide")}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Hide Comment
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleCommentAction(comment._id, "restore")}>
                            <Eye className="mr-2 h-4 w-4" />
                            Restore Comment
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

      {/* Comment Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comment Details</DialogTitle>
            <DialogDescription>View and moderate this comment</DialogDescription>
          </DialogHeader>

          {selectedComment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={selectedComment.author?.avatar || "/placeholder.svg"}
                    alt={selectedComment.author?.username}
                  />
                  <AvatarFallback>{selectedComment.author?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedComment.author?.username}</p>
                  <p className="text-sm text-muted-foreground">{selectedComment.author?.email}</p>
                </div>
                <Badge variant={selectedComment.visible ? "default" : "secondary"} className="ml-auto">
                  {selectedComment.visible ? "Visible" : "Hidden"}
                </Badge>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm">{selectedComment.content}</p>
              </div>

              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Reports: {selectedComment.reportCount}</span>
                <span>Created: {new Date(selectedComment.createdAt).toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                <Label>Action Reason (optional)</Label>
                <Textarea
                  placeholder="Enter reason for action..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedComment?.visible ? (
              <Button variant="outline" onClick={() => handleCommentAction(selectedComment!._id, "hide")}>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Comment
              </Button>
            ) : (
              <Button variant="outline" onClick={() => handleCommentAction(selectedComment!._id, "restore")}>
                <Eye className="mr-2 h-4 w-4" />
                Restore Comment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
