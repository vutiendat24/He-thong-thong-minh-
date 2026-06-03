
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdmin } from "@/lib/admin-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"

const navItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["moderator", "admin", "superadmin"],
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: AlertTriangle,
    roles: ["moderator", "admin", "superadmin"],
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["admin", "superadmin"],
  },
  {
    title: "Posts",
    href: "/admin/posts",
    icon: FileText,
    roles: ["moderator", "admin", "superadmin"],
  },
  {
    title: "Comments",
    href: "/admin/comments",
    icon: MessageSquare,
    roles: ["moderator", "admin", "superadmin"],
  },
  
]

export function AdminSidebar() {
  const { pathname } = useLocation();
  const { currentUser, hasPermission } = useAdmin()
  const [collapsed, setCollapsed] = useState(false)

  const filteredNavItems = navItems.filter((item) => hasPermission(item.roles as any))

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && <p className="text-[30px]  font-semibold text-sidebar-foreground">Admin Page</p>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.username} />
            <AvatarFallback>{currentUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">{currentUser.username}</span>
              <span className="text-xs capitalize text-muted-foreground">{currentUser.role}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
