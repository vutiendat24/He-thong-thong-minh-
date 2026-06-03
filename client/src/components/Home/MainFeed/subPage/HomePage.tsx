import { useEffect, useState, useRef } from 'react'
import { usePostContext } from '../../../../context/PostContext'
import CommentsOverlay from "./CommentOverlay"
import ReportMenu from "./ReportMenu"

import type Post from "../../../../fomat/type/Post"

import { Heart, MessageCircle, Settings } from "lucide-react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaShare } from "react-icons/fa"
import axios from 'axios'

const collectUserData = (eventType: string, data: any) => {
    const userData = {
        timestamp: new Date().toISOString(),
        eventType,
        postId: data.postId,
        dwell_time: data.dwell_time ?? 0,
        target_userID: data.target_userID ?? null,
        // data,
        sessionId: getSessionId()
    }

    // Lưu vào memory 
    if (eventType === "view" && data.dwell_time < 1.5) {
        return
    }
    saveAnalytics(userData)

    // console.log('User Data Collected:', userData)
}

// Lấy hoặc tạo session ID
const getSessionId = () => {
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
}

let analyticsData: any[] = []
const saveAnalytics = async (data: any) => {
    analyticsData.push(data)

    // Có thể gửi lên server khi đạt một số lượng nhất định
    if (analyticsData.length >= 10) {
        try {
            const userID = localStorage.getItem("userID")
            await axios.post(

                `http://localhost:3000/melody/tracking/track/${userID}`,
                analyticsData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            console.log('✅ Analytics sent:', analyticsData.length, 'events');
            analyticsData = []; // Reset

        } catch (error) {
            console.error('❌ Failed to send analytics:', error);
            // Giữ lại data để thử gửi lại lần sau
        }
    }
}

export default function PostPage() {
    const [selectedPost, setSelectedPost] = useState<Post | null>(null)
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [viewStartTime, setViewStartTime] = useState<number>(Date.now())
    const [expanded, setExpanded] = useState(false)

    const { posts, addComment, updateLikePost, handleTokenExpired } = usePostContext()

    // THÊM: Ref để lưu thời gian bắt đầu xem mỗi post
    const postViewTimes = useRef<Map<string, number>>(new Map())



    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const postId = entry.target.getAttribute('data-post-id')

                    if (entry.isIntersecting) {
                        // Post BẮT ĐẦU hiển thị
                        if (!postViewTimes.current.has(postId!)) {
                            postViewTimes.current.set(postId!, Date.now())
                        }
                    } else {
                        // Post BIẾN MẤT khỏi viewport
                        if (postViewTimes.current.has(postId!)) {
                            const startTime = postViewTimes.current.get(postId!)!
                            const viewDuration = Date.now() - startTime
                            const post = posts.find(p => p.id === postId)

                            collectUserData('view', {
                                postId,
                                target_userID: post?.userID,
                                dwell_time: Math.floor(viewDuration / 1000), // giây
                                visibilityRatio: entry.intersectionRatio
                            })

                            // Xóa khỏi Map sau khi ghi nhận
                            postViewTimes.current.delete(postId!)
                        }
                    }
                })
            },
            { threshold: [0.5] } // Trigger khi 50% post visible
        )

        const postElements = document.querySelectorAll('[data-post-id]')
        postElements.forEach((el) => observer.observe(el))

        // Cleanup: Gửi data cho các post đang xem khi user rời trang
        return () => {
            postViewTimes.current.forEach((startTime, postId) => {
                const viewDuration = Date.now() - startTime
                const post = posts.find(p => p.id === postId)

                collectUserData('view', {
                    postId,
                    target_userID: post?.userID,
                    viewDuration: Math.floor(viewDuration / 1000),
                    reason: 'page_leave' // Đánh dấu là do rời trang
                })
            })
            observer.disconnect()
        }
    }, [posts])

    const handleOpenComments = (post: Post) => {
        setSelectedPost(post)
        setIsCommentsOpen(true)
        setViewStartTime(Date.now()) // ✅ FIX: Set viewStartTime khi mở

        collectUserData('open_comments', {
            postId: post.id,
            target_userID: post.userID,
            commentCount: post.commentCount
        })
    }

    const handleCloseComments = () => {
        setIsCommentsOpen(false)
        setSelectedPost(null)
    }

    const handleLikeClick = (post: Post) => {
        updateLikePost(post.id)

        collectUserData('like_post', {
            postId: post.id,
            target_userID: post.userID,
            action: post.isLiked ? 'unlike' : 'like',
            currentLikes: post.likes
        })
    }

    const handleShareClick = (post: Post) => {
        collectUserData('share_click', {
            postId: post.id,
            target_userID: post.userID
        })
    }

    const handleViewAllComments = (post: Post) => {
        collectUserData('view_all_comments_click', {
            postId: post.id,
            target_userID: post.userID,
            commentCount: post.commentCount
        })
        handleOpenComments(post)
    }

    const handleAvatarClick = (post: Post) => {
        collectUserData('profile_click', {
            target_userID: post.id,
            username: post.fullname,
            clickLocation: 'avatar'
        })
    }

    return (
        <>
            <div className="h-screen overflow-y-auto scrollbar-hide">
                <div className="py-4 lg:py-8 px-2 lg:px-4">
                    {posts.map((post) => (
                        <Card
                            key={post.id}
                            className="mb-4 lg:mb-6 shadow-none"
                            data-post-id={post.id}
                        >
                            <CardContent className="p-0">
                                {/* Post Header */}
                                <div className="flex items-start gap-3 p-4">
                                    <Avatar
                                        className="h-15 w-15 cursor-pointer"
                                        onClick={() => handleAvatarClick(post)}
                                    >
                                        <AvatarImage src={post.avatar || "https://res.cloudinary.com/dsfgzdr5z/image/upload/v1765428569/jmhwx3kbhxxa10jmunzr.png"} />
                                    </Avatar>
                                    <div className="flex-1 text-start text-2xl">
                                        <p
                                            className="font-semibold cursor-pointer hover:underline"
                                            onClick={() => handleAvatarClick(post)}
                                        >
                                            {post.fullname}
                                        </p>
                                        <p className="text-xl text-gray-500">{post.created_at}</p>
                                    </div>
                                    
                                    <ReportMenu targetId={post.id} targetType='post' />
                                </div>
                                   <p className="text-start ">
                                        <p className={` text-l p-1 break-words ${expanded ? "" : "line-clamp-2"}`} >
                                            {post.caption}
                                        </p>

                                        {(post.caption?.length ?? 0)> 80 && (
                                            <p
                                                onClick={() => setExpanded(!expanded)}
                                                className="text-xs text-blue-500 hover:underline cursor-pointer mt-1"
                                            >
                                                {expanded ? "Thu gọn" : "Xem thêm"}
                                            </p>
                                        )}
                                    </p>
                                {/* trường hợp post co anh  */}
                                {/* Post Image */}
                                {post.image && 
                                <div className="aspect-square bg-gray-100">
                                    <img
                                        src={post.image }
                                        alt={`Post by ${post.fullname}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                }
                                {/* Post Actions */}
                                <div className="p-4">
                                    <div className="flex items-center gap-4 mb-3">
                                        <Button
                                            size="sm"
                                            className="p-0 bg-green-400 hover:bg-green-500"
                                            onClick={() => handleLikeClick(post)}
                                        >
                                            <Heart
                                                size={24}
                                                color={post.isLiked === true ? "red" : "white"}
                                                fill={post.isLiked === true ? "red" : "white"}
                                            />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0"
                                            onClick={() => handleOpenComments(post)}
                                        >
                                            <MessageCircle size={24} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0"
                                            onClick={() => handleShareClick(post)}
                                        >
                                            <FaShare />
                                        </Button>
                                    </div>
                                    <div className='flex gap-10'>
                                        <p className="text-start font-semibold text-sm mb-1">
                                            {post.likes.toLocaleString()} lượt thích
                                        </p>
                                        <p
                                            onClick={() => handleOpenComments(post)}
                                            className="cursor-pointer text-start font-semibold text-sm mb-1"
                                        >
                                            {post.commentCount} bình luận
                                        </p>
                                    </div>

                                 

                                
                                    <button
                                        className="text-sm text-gray-500 mt-1 hover:text-gray-700"
                                        onClick={() => handleViewAllComments(post)}
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
                updateLikePost={updateLikePost}
                commentID='68f9bfe7402d40a361408cf9'
            />
        </>
    )
}