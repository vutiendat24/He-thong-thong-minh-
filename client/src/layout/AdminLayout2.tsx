import { AdminProvider } from "@/lib/admin-context"
import { AdminSidebar } from "../components/Admin2/Sidebar"
import { AdminHeader } from "../components/Admin2/Header"
import { Outlet } from "react-router-dom"


export default function AdminLayout() {
  return (
    <AdminProvider>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-auto bg-background p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminProvider>
  )
}