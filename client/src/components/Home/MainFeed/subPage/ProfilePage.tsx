"use client"

import type React from "react"
import type { ApiResponse } from "../../../../fomat/APIfomat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import CommentsOverlay from "../subPage/CommentOverlay"
import { useEffect, useRef, useState } from "react"
import type Post from "../../../../fomat/type/Post"
import { usePostContext } from "@/context/PostContext"
import type { PersonalInfo } from "../../../../fomat/type/PersonalInfo"
import axios, { Axios, AxiosError } from "axios"
import { useParams } from "react-router-dom"
import { MessageSquare, Heart, Camera, Eye, Upload, UserPlus, UserMinus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
    const { addComment, currrentUserId, updateLikePost, handleTokenExpired } = usePostContext()
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [selectedPost, setSelectedPost] = useState<Post | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)
    const [isFollowLoading, setIsFollowLoading] = useState(false)
    const [refreshPosts, setRefreshPosts] = useState(false)
    const { userID } = useParams<{ userID: string }>()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isOwnProfile = userID === currrentUserId
    const handleOpenComment = (post: Post) => {
        setSelectedPost(post)
        setIsCommentsOpen(true)
    }

    const handleCloseComment = () => {
        setSelectedPost(null)
        setIsCommentsOpen(false)
        setRefreshPosts(!refreshPosts)
    }
    const handleUploadClick = () => {
        console.log("Upload clicked - triggering file input")
        fileInputRef.current?.click()
    }
    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("image", file);

        const res = await axios.post(
            "http://localhost:3000/melody/post/upload-image",
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: false,
            }
        );

        return res.data.imageUrl; // URL lay tu  Cloudinary tra ve 
    };
    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("doi avatar")
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setIsUploadingAvatar(true)

            // Bước 1: Upload lên Cloudinary
            console.log("Uploading to Cloudinary...")
            const imgURL = await uploadToCloudinary(file);
            console.log("Cloudinary URL:", imgURL)

            // Bước 2: Cập nhật avatar trong database
            const token = localStorage.getItem("token")

            // Gửi JSON thay vì FormData
            const response = await axios.post(
                `http://localhost:3000/melody/profile/update-avatar/${userID}`,
                { avatar: imgURL },  // Gửi object JSON
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",  // Đổi thành JSON
                    },
                }
            )

            console.log("Update avatar response:", response.data)

            if (response.data.data.avatar) {
                setPersonalInfo((prev) =>
                    prev ? { ...prev, avatar: response.data.data.avatar } : null
                )
                setIsAvatarDialogOpen(false) // Đóng dialog sau khi thành công
            }
        } catch (err) {
            const error = err as AxiosError
            console.error("Error uploading avatar:", error)

            if (error.response?.status === 401) {
                handleTokenExpired()
            } else {
                // Hiển thị lỗi cho user
                alert("Không thể cập nhật ảnh đại diện. Vui lòng thử lại!")
            }
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleFollowToggle = async () => {
        try {
            setIsFollowLoading(true)
            const token = localStorage.getItem("token")

            if (isFollowing) {
                const res = await axios.post(
                    `http://localhost:3000/melody/profile/unfollow/${userID}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                )
                if (res.data.status === 401) {
                    handleTokenExpired()
                }
                setIsFollowing(false)
                setPersonalInfo((prev) => (prev ? { ...prev, totalFolower: (prev.totalFolower || 0) - 1 } : null))
            } else {
                const res = await axios.post(
                    `http://localhost:3000/melody/profile/follow/${userID}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                )
                if (res.data.status === 401) {
                    handleTokenExpired()
                }
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
        try {
            const token = localStorage.getItem("token")
            const peronalInfoRes = await axios.get(`http://localhost:3000/melody/profile/get-profile/${userID}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            setPersonalInfo(peronalInfoRes.data.data)
            setIsFollowing(peronalInfoRes.data.data.isFollowing || false)

        } catch (error) {
            const err = error as AxiosError<ApiResponse>;

            if (err.response?.status === 401) {
                handleTokenExpired()
            }
        }

    }

    const getPosts = async () => {
        try {
            setIsLoading(true)
            const token = localStorage.getItem("token")
            const PostDataRes = await axios.get(`http://localhost:3000/melody/post/get-posts/${userID}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            console.log("PostDataRes", PostDataRes)
            if (PostDataRes.data.status === 401) {
                handleTokenExpired()
            }
            const postsData = PostDataRes.data.data
            setPosts(postsData)
           
            console.log(postsData)
        } catch (error) {
            console.error("Error fetching posts:", error)
        } finally {
            setIsLoading(false)
        }
    }
    useEffect(() => {
        getPosts()
        getUserInfo()
    }, [refreshPosts])

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
                                <>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className="absolute inline-block bottom-0 right-0 z-10 h-7 w-7"
                                                aria-label="Tùy chọn avatar"
                                            >
                                                <Camera className="h-5 w-5" />
                                            </button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => setIsAvatarDialogOpen(true)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Xem ảnh đại diện
                                            </DropdownMenuItem>

                                            {/* THAY ĐỔI Ở ĐÂY */}
                                            <DropdownMenuItem onClick={handleUploadClick} disabled={isUploadingAvatar}>
                                                <Upload className="h-4 w-4 mr-2" />
                                                {isUploadingAvatar ? "Đang tải..." : "Đổi ảnh đại diện"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Input ẨN bên ngoài DropdownMenu */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                        disabled={isUploadingAvatar}
                                    />
                                </>
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
                                        className="gap-2 text-red-600"
                                    >
                                        {isFollowing ? (
                                            <>
                                                <UserMinus className="h-4 w-4 text-blue-700" />
                                                <p> Hủy kết bạn  </p>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 text-red-700" />
                                                Thêm bạn
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
                    updateLikePost={updateLikePost}

                />
            )}
        </>
    )
}
