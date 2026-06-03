import { Outlet, Link, useLocation } from "react-router-dom"
import { BarChart3, Users, FileText, AlertCircle, Flame, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/content", label: "Reports", icon: FileText },
    // { path: "/reports", label: "Reports", icon: AlertCircle },
    { path: "/admin/hot-content", label: "Hot Content", icon: Flame },
  ]
  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await axios.post("http://localhost:3000/melody/auth/logout", { headers: { Authorization: `Bearer ${token}` } });
        } catch (e) {
          // ignore error but proceed to clear token
        }
      }
      localStorage.removeItem("token");
      localStorage.removeItem("userID");
      try { delete axios.defaults.headers.common["Authorization"]; } catch { }
    } catch (e) {
      console.warn("Error clearing token on sign out:", e);
    }
    navigate("/");
  }
  
  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a1a] border-r border-[#404040] flex flex-col">
        <div className="p-6 border-b border-[#404040]">
          <h1 className="text-xl font-bold text-[#e5e7eb]">Quản trị viên </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-[#3b82f6] !text-white" : "text-[#9ca3af] hover:bg-[#252525]"
                  }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-2 lg:p-3 border-t">
          <Button
            className="w-full justify-center lg:justify-start gap-0 lg:gap-3 h-12 text-cyan-200"
            onClick={handleSignOut}
          >
            <User></User>
            <span className="text-base lg:inline">Đăng xuất</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
