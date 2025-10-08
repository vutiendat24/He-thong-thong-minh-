

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"




export default function NotificationsPage() {
  const notifications = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    fullname: `user${i + 1}`,
    avatar: `/placeholder.svg?height=40&width=40&query=user${i + 1}`,
    action: i % 3 === 0 ? "liked" : i % 3 === 1 ? "commented" : "followed",
    time: `${Math.floor(Math.random() * 24)}h`,
    read: i > 5,
  }))

  return (
    <div className="h-screen overflow-y-auto scrollbar-hide">
      <div className="p-4 lg:p-8">
        <h2 className="text-xl font-semibold mb-6">Thông báo</h2>
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} className={`flex items-center gap-3 p-3 rounded-lg ${!notif.read ? "bg-blue-50" : ""}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={notif.avatar || "/placeholder.svg"} />
                <AvatarFallback>{notif.fullname[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{notif.fullname}</span>
                  {notif.action === "liked" && " đã thích bài viết của bạn"}
                  {notif.action === "commented" && " đã bình luận về bài viết của bạn"}
                  {notif.action === "followed" && " đã bắt đầu theo dõi bạn"}
                </p>
                <p className="text-xs text-gray-500">{notif.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}