import { useEffect, useState } from 'react'
import { usePostContext } from '../../../../context/PostContext'
import CommentsOverlay from "./CommentOverlay"


import type Post from "../../../../fomat/type/Post"






import { Heart, MessageCircle, Settings } from "lucide-react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaShare } from "react-icons/fa";







export default function HomePage() {
    const [selectedPost, setSelectedPost] = useState<Post | null>(null)
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)

    const { posts, addComment, updateLikePost } = usePostContext()

    const handleOpenComments = (post: Post) => {
        setSelectedPost(post)
        setIsCommentsOpen(true)
    }

    const handleCloseComments = () => {
        setIsCommentsOpen(false)
        setSelectedPost(null)
    }

    return (
        <>
            <div className="h-screen overflow-y-auto scrollbar-hide">
                <div className="py-4 lg:py-8 px-2 lg:px-4">
                    {posts.map((post) => (
                        <Card key={post.id} className="mb-4 lg:mb-6 shadow-none">
                            <CardContent className="p-0 ">
                                {/* Post Header */}
                                <div className="flex items-start   gap-3 p-4">
                                    <Avatar className="h-15 w-15 ">
                                        <AvatarImage src={post.avatar || "/placeholder.svg"} />
                                    </Avatar>
                                    <div className="flex-1 text-start text-2xl ">
                                        <p className="font-semibold ">{post.fullname}</p>
                                        <p className="text-xl text-gray-500">{post.time}</p>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <Settings size={16} />
                                    </Button>
                                </div>

                                {/* Post Image */}
                                <div className="aspect-square bg-gray-100">
                                    <img
                                        src={post.image || "/placeholder.svg"}
                                        alt={`Post by ${post.fullname}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Post Actions */}
                                <div className="p-4">
                                    <div className="flex items-center gap-4 mb-3">
                                        <Button size="sm" className="p-0"
                                            onClick={() => updateLikePost(post.id)}
                                        >
                                            <Heart size={24}
                                                color={`${post.isLiked === true ? "red" : "black"}`}
                                                fill={`${post.isLiked === true ? "red" : "white"}`}
                                            />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="p-0" onClick={() => handleOpenComments(post)}>
                                            <MessageCircle size={24} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="p-0 ">
                                            <FaShare />
                                        </Button>
                                    </div>
                                    <div className='flex gap-10'>
                                        <p className="text-start font-semibold text-sm mb-1">{post.likes.toLocaleString()} lượt thích</p>
                                        <p onClick={() => handleOpenComments(post)} className="cursor-pointer text-start font-semibold text-sm mb-1">{post.commentCount} bình luận</p>
                                    </div>

                                    <p className="text-start text-sm">
                                        <span className="font-semibold">{post.fullname}</span> {post.caption}
                                    </p>
                                    <button
                                        className="text-sm text-gray-500 mt-1 hover:text-gray-700"
                                        onClick={() => handleOpenComments(post)}
                                    >
                                        Xem tất cả {post.commentCount} bình luận
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <CommentsOverlay
                post={selectedPost}
                isOpen={isCommentsOpen}
                onClose={handleCloseComments}
                onUpdateComments={addComment}
            />
        </>
    )
}