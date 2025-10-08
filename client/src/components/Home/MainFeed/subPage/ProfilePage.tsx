

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"





export default function ProfilePage() {
    return (
        <div className="h-screen overflow-y-auto scrollbar-hide">
            <div className="p-4 lg:p-8">
                <div className="flex items-center gap-6 mb-8">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src="/professional-profile-post.png" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-2">fullname</h2>
                        <div className="flex gap-6 text-sm">
                            <span>
                                <strong>123</strong> bài viết
                            </span>
                            <span>
                                <strong>456</strong> người theo dõi
                            </span>
                            <span>
                                <strong>789</strong> đang theo dõi
                            </span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }, (_, i) => (
                        <div key={i} className="aspect-square bg-gray-100">
                            <img src="/professional-profile-post.png" alt={`Post ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}