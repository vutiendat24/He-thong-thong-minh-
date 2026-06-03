 

import { AlertTriangle, Clock, Ban, Unlock} from "lucide-react"
import type { User }from "../../fomat/adminType/adminPageTypes"


interface UserTableProps {
  users: User[]
  onWarn: (user: User) => void
  onTempBan: (user: User) => void
  onBan: (user: User) => void
  onUnBan: (user: User) => void
}

export default function UserTable({ users,onUnBan, onWarn, onTempBan, onBan }: UserTableProps) {
  const getStatusBadge = (status: string, warningCount: number) => {
    const baseClass = "px-3 py-1 rounded-full text-xs font-medium"
    switch (status) {
      case "active":
        return <span className={`${baseClass} bg-[#064e3b] text-[#86efac]`}>Active</span>
      case "warning":
        return <span className={`${baseClass} bg-[#7f2f1f] text-[#fbbf24]`}>⚠️ Warning ({warningCount})</span>
      case "temp_banned":
        return <span className={`${baseClass} bg-[#5f1a1a] text-[#fca5a5]`}>Temp Banned</span>
      case "banned":
        return <span className={`${baseClass} bg-[#7f1d1d] text-[#fca5a5]`}>Banned</span>
      default:
        return <span className={`${baseClass} bg-[#252525] text-[#9ca3af]`}>{status}</span>
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-[#404040]">
        <p className="text-[#9ca3af]">Không có người dùng</p>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] overflow-hidden">
      <table className="w-full text-mm">
        <thead>
          <tr className="border-b border-[#404040] bg-[#252525]">
            <th className="px-6 py-4 text-left text-[#79e9f1] font-semibold">Người dùng</th>
            <th className="px-6 py-4 text-center text-[#79e9f1] font-semibold">Trạng thái</th>
            <th className="px-6 py-4 text-center text-[#79e9f1] font-semibold">Ngày tham gia</th>
            <th className="px-6 py-4 text-center text-[#79e9f1] font-semibold">Lần cuối đăng nhập</th>
            <th className="px-6 py-4 text-right text-[#79e9f1] font-semibold">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-b border-[#404040] hover:bg-[#252525] transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#404040] flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user?.avatar || "https://anhavatardep.com/wp-content/uploads/2025/05/avatar-don-gian-8.jpg"}
                        // alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={user?.avatar || "https://anhavatardep.com/wp-content/uploads/2025/05/avatar-don-gian-8.jpg"}
                        // alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-start font-medium mb-1 text-[#ced3dd]">{user.username}</p>
                    <p className="text-start italic text-m mb-1 text-[#7aa1f0]">{user.email}</p>
                    <p className="text-start text-m text-[#6b7280]">{user._id}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">{getStatusBadge(user.status, user.warningCount)}</td>
              <td className="px-6 py-4 text-[#9ca3af]">{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-[#9ca3af]">{new Date(user.lastLoginAt).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {user.status === "active" ?
                    <>
                      <button
                        onClick={() => onWarn(user)}
                        className="p-2 hover:bg-[#3f3f3f] rounded transition-colors"
                        title="Send Warning"
                      >
                        <AlertTriangle size={16} className="text-[#f59e0b]" />
                      </button>
                      <button
                        onClick={() => onTempBan(user)}
                        className="p-2 hover:bg-[#3f3f3f] rounded transition-colors"
                        title="Temporary Ban"
                      >
                        <Clock size={16} className="text-[#f59e0b]" />
                      </button>
                      <button
                        onClick={() => onBan(user)}
                        className="p-2 hover:bg-[#3f3f3f] rounded transition-colors"
                        title="Permanent Ban"
                      >
                        <Ban size={16} className="text-[#ef4444]" />
                      </button>
                    </>
                    :
                    <>
                      <button
                        onClick={() => onUnBan(user)}
                        className="p-2 hover:bg-[#3f3f3f] rounded transition-colors"
                        title="Send Warning"
                      >
                        <Unlock size={16} className="text-[#1be72c]" />
                      </button>
                      <button
                        onClick={() => onWarn(user)}
                        className="p-2 hover:bg-[#3f3f3f] rounded transition-colors"
                        title="Send Warning"
                      >
                        <AlertTriangle size={16} className="text-[#f59e0b]" />
                      </button>
                      <button
                        onClick={() => onTempBan(user)}
                        className="p-2 hover:bg-[#3f3f3f] rounded transition-colors"
                        title="Temporary Ban"
                      >
                        <Clock size={16} className="text-[#f59e0b]" />
                      </button>
                      <button
                        onClick={() => onBan(user)}
                        className="p-2 hover:bg-[#3f3f3f] rounded transition-colors"
                        title="Permanent Ban"
                      >
                        <Ban size={16} className="text-[#ef4444]" />
                      </button>
                    </>
                  }
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
