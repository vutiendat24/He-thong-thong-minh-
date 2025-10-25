"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function RightSidebar() {
  
  const suggestedUsers = [{
    id:1,
    fullname: "Nguyễn Quốc Trí ",
    avatar: "https://res.cloudinary.com/ddmtoinra/image/upload/v1761148375/ywiuylkoaavmz8c9ftu4.jpg",
    mutualFriends: Math.floor(Math.random() * 50) + 1,
  },
  {
    id:2,
    fullname: "Triệu Việt Thành ",
    avatar: "https://res.cloudinary.com/ddmtoinra/image/upload/v1761148375/ywiuylkoaavmz8c9ftu4.jpg",
    mutualFriends: Math.floor(Math.random() * 50) + 1,
  }]
  const navigate = useNavigate()
  
  return (
    <div className="hidden xl:block w-72 2xl:w-80 border-l border-gray-200 transition-all duration-300">
      <div className="h-screen overflow-y-auto scrollbar-hide">
        <div className="p-4 xl:p-6">
          {/* Current User */}
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="h-12 xl:h-14 w-12 xl:w-14">
              <AvatarImage src="https://res.cloudinary.com/ddmtoinra/image/upload/v1761148243/iffzkmaffztpxsbxytfu.jpg" />
              <AvatarFallback>YU</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {/* <p className="font-semibold text-sm xl:text-base">tiendat0906</p> */}
              <p className="text-xs xl:text-sm text-gray-500">Tiến Đạt</p>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-500 font-semibold text-xs xl:text-sm"
              onClick={()=>{
                localStorage.removeItem("userID")
                localStorage.removeItem("token")
                navigate("/")
              }}
            >
              Chuyển
            </Button>
          </div>

          {/* Suggested Users */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-500 text-xs xl:text-sm">Gợi ý cho bạn</h3>
             
            </div>

            <div className="space-y-3">
              {suggestedUsers.slice(0, 8).map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user.fullname[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user.fullname}</p>
                    <p className="text-xs text-gray-500">{user.mutualFriends} bạn chung</p>
                  </div>
                  <Button size="sm" className="text-xs text-red-400 font-semibold h-8 px-3 xl:px-4 shrink-0">
                    Theo dõi
                  </Button>
                </div>
              ))}
            </div>
          </div>

       
        </div>
      </div>
    </div>
  )
}
