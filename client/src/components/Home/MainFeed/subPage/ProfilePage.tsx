"use client"

import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import CommentsOverlay from "../subPage/CommentOverlay"
import { useEffect, useState } from "react"
import type Post from "../../../../fomat/type/Post"
import { usePostContext } from "@/context/PostContext"
import type { PersonalInfo } from "../../../../fomat/type/PersonalInfo"
import axios from "axios"
import { MessageSquare, Heart, Camera, Eye, Upload, UserPlus, UserMinus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default function ProfilePage({ userID }: { userID: string }) {
    const { addComment, currrenUserId } = usePostContext()
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [selectedPost, setSelectedPost] = useState<Post | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)
    const [isFollowLoading, setIsFollowLoading] = useState(false)

    const isOwnProfile = userID === currrenUserId

    const handleOpenComment = (post: Post) => {
        setSelectedPost(post)
        setIsCommentsOpen(true)
    }

    const handleCloseComment = () => {
        setSelectedPost(null)
        setIsCommentsOpen(false)
    }

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setIsUploadingAvatar(true)
            const token = localStorage.getItem("token")
            const formData = new FormData()
            formData.append("avatar", file)

            const response = await axios.post(`http://localhost:3000/melody/profile/update-avatar/${userID}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            })

            if (response.data.data.avatar) {
                setPersonalInfo((prev) => (prev ? { ...prev, avatar: response.data.data.avatar } : null))
            }
        } catch (error) {
            console.error("Error uploading avatar:", error)
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleFollowToggle = async () => {
        try {
            setIsFollowLoading(true)
            const token = localStorage.getItem("token")

            if (isFollowing) {
                await axios.post(
                    `http://localhost:3000/melody/profile/unfollow/${userID}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                )
                setIsFollowing(false)
                setPersonalInfo((prev) => (prev ? { ...prev, totalFolower: (prev.totalFolower || 0) - 1 } : null))
            } else {
                await axios.post(
                    `http://localhost:3000/melody/profile/follow/${userID}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                )
                setIsFollowing(true)
                setPersonalInfo((prev) => (prev ? { ...prev, totalFolower: (prev.totalFolower || 0) + 1 } : null))
            }
        } catch (error) {
            console.error("Error toggling follow:", error)
        } finally {
            setIsFollowLoading(false)
        }
    }

    const getUserInfo = async () => {
        const token = localStorage.getItem("token")
        const peronalInfoRes = await axios.get(`http://localhost:3000/melody/profile/get-profile/${userID}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        setPersonalInfo(peronalInfoRes.data.data)
        setIsFollowing(peronalInfoRes.data.data.isFollowing || false)
        console.log("userID", userID)
        console.log(peronalInfoRes.data.data)
    }

    useEffect(() => {
        const getPosts = async () => {
            try {
                setIsLoading(true)
                const token = localStorage.getItem("token")
                const PostDataRes = await axios.get(`http://localhost:3000/melody/post/get-posts/${userID}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                const postsData = PostDataRes.data.data
                setPosts(postsData)
            } catch (error) {
                console.error("Error fetching posts:", error)
            } finally {
                setIsLoading(false)
            }
        }

        getPosts()
        getUserInfo()
    }, [])

    return (
        <>
            <div className="h-screen overflow-y-auto scrollbar-hide">
                <div className="p-4 lg:p-8">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative inline-block">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={personalInfo?.avatar || "/placeholder.svg"} />
                            </Avatar>

                            {isOwnProfile && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="absolute inline-block bottom-0 right-0 z-10 h-7 w-7    "
                                            aria-label="Tùy chọn avatar"
                                        >
                                            <Camera className="h-5 w-5 " />
                                        </button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => setIsAvatarDialogOpen(true)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Xem ảnh đại diện
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <label className="cursor-pointer">
                                                <Upload className="h-4 w-4 mr-2" />
                                                Đổi ảnh đại diện
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleAvatarChange}
                                                    disabled={isUploadingAvatar}
                                                />
                                            </label>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>


                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-xl font-semibold">{personalInfo?.fullname || "Loading..."}</h2>
                                {!isOwnProfile && (
                                    <Button
                                        onClick={handleFollowToggle}
                                        disabled={isFollowLoading}
                                        variant={isFollowing ? "outline" : "default"}
                                        size="sm"
                                        className="gap-2"
                                    >
                                        {isFollowing ? (
                                            <>
                                                <UserMinus className="h-4 w-4" />
                                                Bỏ theo dõi
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4" />
                                                Theo dõi
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-6 text-sm">
                                <span>
                                    <strong>{posts.length}</strong> bài viết
                                </span>
                                <span>
                                    <strong>{personalInfo?.totalFolower || 0}</strong> người theo dõi
                                </span>
                                <span>
                                    <strong>{personalInfo?.totalFolowing || 0}</strong> đang theo dõi
                                </span>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-3 gap-1">
                            {Array.from({ length: 9 }, (_, i) => (
                                <div key={i} className="aspect-square bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="aspect-square bg-muted relative group cursor-pointer"
                                    onClick={() => handleOpenComment(post)}
                                >
                                    {post.image ? (
                                        <img
                                            src={post.image || "/placeholder.svg"}
                                            alt={post.caption}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                            <p className="text-sm text-muted-foreground text-center p-4 line-clamp-3">{post.caption}</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                                        <div className="flex items-center gap-2">
                                            <Heart className="h-5 w-5 fill-white" />
                                            <span className="font-semibold">{post.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5 fill-white" />
                                            <span className="font-semibold">{post.commentCount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Chưa có bài viết nào</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ảnh đại diện</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4">
                        <img
                            src={personalInfo?.avatar || "/placeholder.svg"}
                            alt={personalInfo?.fullname || "Avatar"}
                            className="w-full h-auto rounded-lg"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {selectedPost && (
                <CommentsOverlay
                    isOpen={isCommentsOpen}
                    onClose={handleCloseComment}
                    post={selectedPost}
                    onUpdateComments={addComment}
                />
            )}
        </>
    )
}
