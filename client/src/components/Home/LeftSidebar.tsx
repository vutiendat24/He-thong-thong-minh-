
import { useNavigate } from "react-router-dom"
import { Heart, Home, Search, Compass, MessageCircle, PlusSquare, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NavigationPage } from "./../../fomat/type/NavigationPage"

interface LeftSidebarProps {
  currentPage: NavigationPage
  onNavigate: (page: NavigationPage) => void
}

export default function LeftSidebar({ currentPage, onNavigate }: LeftSidebarProps) {
  const navigate = useNavigate()
  const navigationItems = [
    { id: "home" as NavigationPage, icon: Home, label: "Trang chủ" },
    { id: "search" as NavigationPage, icon: Search, label: "Tìm kiếm" },
    { id: "explore" as NavigationPage, icon: Compass, label: "Khám phá" },
    { id: "messages" as NavigationPage, icon: MessageCircle, label: "Tin nhắn" },
    { id: "notifications" as NavigationPage, icon: Heart, label: "Thông báo" },
    { id: "create" as NavigationPage, icon: PlusSquare, label: "Tạo" },
    { id: "profile" as NavigationPage, icon: User, label: "Trang cá nhân" },
  ]
  const handleSignOut = () => {

    navigate("/")
  }
  return (
    <div className="w-16 lg:w-56 xl:w-64 2xl:w-72 border-r border-gray-200 flex flex-col fixed h-full z-10 bg-white transition-all duration-300">
      <div className="p-3 lg:p-6">
        <h1 className="text-2xl font-bold font-[Cookie] hidden lg:block">Melody Media</h1>
        <div className="lg:hidden flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IG</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 lg:px-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-center lg:justify-start gap-0 lg:gap-3 h-12 ${isActive ? "bg-gray-100 text-black" : ""
                  }`}
                onClick={() => {
                  if (item.id === "messages") {
                    navigate("/messages")
                  }else if(item.id === "profile" ){
                    const userID = localStorage.getItem("userID")
                    navigate(`/homePage/${item.id}/${userID}`)
                  } else{    
                      navigate(`/homePage/${item.id}`)
                  } 
                }}
              >
                <Icon size={24} />
                <span className="text-base hidden lg:inline">{item.label}</span>
              </Button>
            )
          })}
        </div>
      </nav >

      <div className="p-2 lg:p-3 border-t">
        <Button
          className="w-full justify-center lg:justify-start gap-0 lg:gap-3 h-12 text-cyan-900"
          onClick={handleSignOut}
        >
          <User></User>
          <span className="text-base lg:inline">Đăng xuất</span>
        </Button>
      </div>
    </div >
  )
}
