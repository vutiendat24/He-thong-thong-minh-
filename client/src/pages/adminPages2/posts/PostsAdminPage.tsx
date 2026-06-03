 

import { useState } from "react"
import { Search, Filter, MoreHorizontal, Trash2, RotateCcw, Eye, AlertTriangle } from "lucide-react"
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
import { mockPosts } from "@/lib/mock-data"
import type { Post, PostStatus } from "../../../lib/types"
import { useAdmin } from "@/lib/admin-context"

export default function PostsAdminPage() {
  const { hasPermission } = useAdmin()
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionReason, setActionReason] = useState("")

  const filteredPosts = posts.filter((post) => {
    const matchesStatus = statusFilter === "all" || post.status === statusFilter
    const matchesSearch =
      searchQuery === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.username.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handlePostAction = (postId: string, action: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          switch (action) {
            case "remove":
              return { ...p, status: "removed" as PostStatus }
            case "restore":
              return { ...p, status: "published" as PostStatus }
            case "review":
              return { ...p, status: "under_review" as PostStatus }
            default:
              return p
          }
        }
        return p
      }),
    )
    setModalOpen(false)
    setActionReason("")
  }

  const getStatusBadgeVariant = (status: PostStatus) => {
    switch (status) {
      case "published":
        return "default"
      case "removed":
        return "destructive"
      case "under_review":
        return "secondary"
      default:
        return "outline"
    }
  }

  const publishedCount = posts.filter((p) => p.status === "published").length
  const removedCount = posts.filter((p) => p.status === "removed").length
  const underReviewCount = posts.filter((p) => p.status === "under_review").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Post Management</h1>
        <p className="text-muted-foreground">Manage and moderate user posts</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{underReviewCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Removed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{removedCount}</div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Posts List</CardTitle>
          <CardDescription>
            {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post ID</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post._id}>
                  <TableCell>
                    <span className="font-mono text-sm">{post._id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author?.avatar || "/placeholder.svg"} alt={post.author?.username} />
                        <AvatarFallback>{post.author?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{post.author?.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-2 max-w-[300px] text-sm">{post.content}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(post.status)}>{post.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${post.reportCount > 0 ? "text-amber-600 font-medium" : ""}`}>
                      {post.reportCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
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
                            setSelectedPost(post)
                            setModalOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {post.status !== "under_review" && (
                          <DropdownMenuItem onClick={() => handlePostAction(post._id, "review")}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Force Review
                          </DropdownMenuItem>
                        )}
                        {hasPermission(["admin", "superadmin"]) && post.status !== "removed" && (
                          <DropdownMenuItem
                            onClick={() => handlePostAction(post._id, "remove")}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Post
                          </DropdownMenuItem>
                        )}
                        {post.status === "removed" && (
                          <DropdownMenuItem onClick={() => handlePostAction(post._id, "restore")}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore Post
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

      {/* Post Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>View and moderate this post</DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={selectedPost.author?.avatar || "/placeholder.svg"}
                    alt={selectedPost.author?.username}
                  />
                  <AvatarFallback>{selectedPost.author?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedPost.author?.username}</p>
                  <p className="text-sm text-muted-foreground">{selectedPost.author?.email}</p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedPost.status)} className="ml-auto">
                  {selectedPost.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm">{selectedPost.content}</p>
              </div>

              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Reports: {selectedPost.reportCount}</span>
                <span>Created: {new Date(selectedPost.createdAt).toLocaleString()}</span>
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

          <DialogFooter className="flex-wrap gap-2">
            {selectedPost?.status !== "removed" && hasPermission(["admin", "superadmin"]) && (
              <Button variant="destructive" onClick={() => handlePostAction(selectedPost!._id, "remove")}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Post
              </Button>
            )}
            {selectedPost?.status === "removed" && (
              <Button variant="outline" onClick={() => handlePostAction(selectedPost!._id, "restore")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore Post
              </Button>
            )}
            {selectedPost?.status !== "under_review" && (
              <Button variant="outline" onClick={() => handlePostAction(selectedPost!._id, "review")}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Force Review
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
