 

import type React from "react"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import UserTable from "../../components/Admin/UserTable"
import UserActionModal from "../../components/Admin/UserActionModal" 
import type { User } from  "../../fomat/adminType/adminPageTypes"
import axios from "axios"

export default function UserManagement() {
  const usersMock: User[] = [
  {
    _id: "user_001",
    username: "nguyenvana",
    email: "nguyenvana@gmail.com",
    role: "user",
    status: "active",
    banUntil: null,
    warningCount: 0,
    createdAt: new Date("2025-01-10T08:30:00Z"),
    lastLoginAt: new Date("2025-12-25T10:15:00Z")
  },
  {
    _id: "user_002",
    username: "tranthib",
    avatar: "https://example.com/avatar/b.png",
    email: "tranthib@gmail.com",
    role: "user",
    status: "warning",
    banUntil: null,
    warningCount: 1,
    createdAt: new Date("2025-02-05T09:20:00Z"),
    lastLoginAt: new Date("2025-12-24T18:40:00Z")
  },
  {
    _id: "user_003",
    username: "leminhc",
    avatar: "https://example.com/avatar/c.png",
    email: "leminhc@gmail.com",
    role: "user",
    status: "temp_banned",
    banUntil: new Date("2025-12-30T23:59:59Z"),
    warningCount: 3,
    createdAt: new Date("2025-03-12T14:00:00Z"),
    lastLoginAt: new Date("2025-12-20T07:10:00Z")
  },
  {
    _id: "user_004",
    username: "phamduyd",
    avatar: "https://example.com/avatar/d.png",
    email: "phamduyd@gmail.com",
    role: "user",
    status: "banned",
    banUntil: null,
    warningCount: 5,
    createdAt: new Date("2025-01-25T11:45:00Z"),
    lastLoginAt: new Date("2025-11-30T16:00:00Z")
  },
  {
    _id: "admin_001",
    username: "admin01",
    avatar: "https://example.com/avatar/admin1.png",
    email: "admin01@system.com",
    role: "admin",
    status: "active",
    banUntil: null,
    warningCount: 0,
    createdAt: new Date("2024-12-01T08:00:00Z"),
    lastLoginAt: new Date("2025-12-26T09:00:00Z")
  },
  {
    _id: "user_005",
    username: "hoanganhe",
    avatar: "https://example.com/avatar/e.png",
    email: "hoanganhe@gmail.com",
    role: "user",
    status: "active",
    banUntil: null,
    warningCount: 0,
    createdAt: new Date("2025-04-02T10:10:00Z"),
    lastLoginAt: new Date("2025-12-26T08:45:00Z")
  },
  {
    _id: "user_006",
    username: "vuquangf",
    avatar: "https://example.com/avatar/f.png",
    email: "vuquangf@gmail.com",
    role: "user",
    status: "warning",
    banUntil: null,
    warningCount: 2,
    createdAt: new Date("2025-05-18T15:30:00Z"),
    lastLoginAt: new Date("2025-12-23T21:15:00Z")
  },
  {
    _id: "user_007",
    username: "dangthig",
    avatar: "https://example.com/avatar/g.png",
    email: "dangthig@gmail.com",
    role: "user",
    status: "active",
    banUntil: null,
    warningCount: 0,
    createdAt: new Date("2025-06-01T09:00:00Z"),
    lastLoginAt: new Date("2025-12-22T13:50:00Z")
  },
  {
    _id: "user_008",
    username: "buidinhh",
    avatar: "https://example.com/avatar/h.png",
    email: "buidinhh@gmail.com",
    role: "user",
    status: "temp_banned",
    banUntil: new Date("2025-12-28T23:59:59Z"),
    warningCount: 4,
    createdAt: new Date("2025-07-10T12:00:00Z"),
    lastLoginAt: new Date("2025-12-18T19:20:00Z")
  },
  {
    _id: "user_009",
    username: "nguyenthii",
    avatar: "https://example.com/avatar/i.png",
    email: "nguyenthii@gmail.com",
    role: "user",
    status: "active",
    banUntil: null,
    warningCount: 0,
    createdAt: new Date("2025-08-15T08:25:00Z"),
    lastLoginAt: new Date("2025-12-26T07:30:00Z")
  }
];

  const [users, setUsers] = useState<User[]>(usersMock)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<"warn" | "temp_ban" | "ban" | "un_ban"| null>(null)

  useEffect(() => {
    fetchUsers()
  }, [statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (statusFilter !== "all") params.status = statusFilter
      if (searchTerm) params.search = searchTerm

      const response = await axios.get("http://localhost:3000/melody/admin/users", { params })
      setUsers(response.data)
      // setUsers(usersMock)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const filteredUsers = users.filter(
  (user) =>
    (statusFilter === "all" || user.status === statusFilter) &&
    (searchTerm === "" ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()))
);

  const handleAction = async (userId: string, action: string, days?: number, reason?: string) => {
    try {
      await axios.post(`/users/${userId}/action`, {
        action,
        days,
        reason,
      })
      fetchUsers()
      setSelectedUser(null)
      setActionType(null)
    } catch (error) {
      console.error("Failed to perform action:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#e5e7eb] mb-4">Quản lý người dùng</h1>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-[#6b7280]" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo ID, tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#252525] border border-[#404040] rounded-lg text-[#e5e7eb] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          </form>

          <div className="flex gap-2">
            {[
              { value: "all", label: "Tất cả ", color: "bg-[#252525]" },
              { value: "active", label: "Đang hoạt động", color: "bg-[#064e3b]" },
              { value: "warning", label: "Cảnh cáo", color: "bg-[#7f2f1f]" },
              { value: "temp_banned", label: "Tạm khóa", color: "bg-[#5f1a1a]" },
              { value: "banned", label: "Khóa", color: "bg-[#7f1d1d]" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value)
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === filter.value
                    ? `${filter.color} text-white border border-[#404040]`
                    : "bg-[#252525] text-[#9ca3af] border border-[#404040] hover:bg-[#333333]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="text-center py-8 text-[#9ca3af]">Loading users...</div>
      ) : (
        <UserTable
          users={filteredUsers}
          onWarn={(user) => {
            setSelectedUser(user)
            setActionType("warn")
          }}
          onTempBan={(user) => {
            setSelectedUser(user)
            setActionType("temp_ban")
          }}
          onBan={(user) => {
            setSelectedUser(user)
            setActionType("ban")
          }}
          onUnBan={(user) => {
            setSelectedUser(user)
            setActionType("un_ban")
          }}
        />
      )}

      {/* Action Modal */}
      {selectedUser && actionType && (
        <UserActionModal
          user={selectedUser}
          actionType={actionType}
          onConfirm={handleAction}
          onClose={() => {
            setSelectedUser(null)
            setActionType(null)
          }}
        />
      )}
    </div>
  )
}
