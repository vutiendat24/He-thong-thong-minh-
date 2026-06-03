 

import { useState } from "react"
import { Search, Filter, MoreHorizontal, Lock, Unlock, AlertTriangle, Eye, MessageSquareOff } from "lucide-react"
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
import { mockUsers } from "@/lib/mock-data"
import { UserDetailModal } from "../../../components/Admin2/user-detail-modal"
import type { User, UserStatus, UserRole } from "../../../lib/types"
import { useAdmin } from "@/lib/admin-context"

export default function UsersPage() {
  const { hasPermission } = useAdmin()
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filteredUsers = users.filter((user) => {
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesSearch =
      searchQuery === "" ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesRole && matchesSearch
  })

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleUserAction = (userId: string, action: string, data?: any) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u._id === userId) {
          switch (action) {
            case "lock":
              return { ...u, status: "locked" as UserStatus }
            case "unlock":
              return { ...u, status: "active" as UserStatus }
            case "suspend":
              const banDate = new Date()
              banDate.setDate(banDate.getDate() + Number.parseInt(data?.suspendDays || "7"))
              return { ...u, status: "suspended" as UserStatus, banUntil: banDate }
            case "warning":
              return { ...u, warningCount: u.warningCount + 1 }
            case "disable_comment":
              return { ...u, canComment: false }
            case "enable_comment":
              return { ...u, canComment: true }
            default:
              return u
          }
        }
        return u
      }),
    )
  }

  const getStatusBadgeVariant = (status: UserStatus) => {
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

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "superadmin":
        return "default"
      case "admin":
        return "secondary"
      case "moderator":
        return "outline"
      default:
        return "outline"
    }
  }

  const activeCount = users.filter((u) => u.status === "active").length
  const lockedCount = users.filter((u) => u.status === "locked").length
  const suspendedCount = users.filter((u) => u.status === "suspended").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lockedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{suspendedCount}</div>
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
                placeholder="Search by username or email..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Warnings</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">-</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${user.warningCount > 0 ? "text-amber-600 font-medium" : ""}`}>
                      {user.warningCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {hasPermission(["admin", "superadmin"]) && (
                          <>
                            {user.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user._id, "lock")}
                                className="text-destructive"
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                Lock Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUserAction(user._id, "unlock")}>
                                <Unlock className="mr-2 h-4 w-4" />
                                Unlock Account
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleUserAction(user._id, "warning")}>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Send Warning
                            </DropdownMenuItem>
                            {user.canComment && (
                              <DropdownMenuItem onClick={() => handleUserAction(user._id, "disable_comment")}>
                                <MessageSquareOff className="mr-2 h-4 w-4" />
                                Disable Comments
                              </DropdownMenuItem>
                            )}
                          </>
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

      {/* User Detail Modal */}
      <UserDetailModal user={selectedUser} open={modalOpen} onOpenChange={setModalOpen} onAction={handleUserAction} />
    </div>
  )
}
