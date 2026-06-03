
import { useState, useCallback } from "react"
import { Search, User, BookOpen, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import axios, { AxiosError } from "axios"
import { useNavigate } from "react-router-dom"
import { usePostContext } from "@/context/PostContext"
import type Post from "@/fomat/type/Post"
import CommentsOverlay from "./CommentOverlay"


interface SearchUser {
  id: string
  fullname: string
  totalFollower: number
  avatar: string
  isFollowing: boolean
}

interface SearchPost {
  id: string
  image: string
  commentCount: number
  likeCount: number
  userID: string,
  fullname: string
  likes: number,
  isLiked: boolean
  created_at: string
}



const recentSearches = ["Tien Dat"]


export default function SearchPage() {
  const [activeTab, setActiveTab] = useState("top")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [users, setUsers] = useState<SearchUser[]>([])
  const [posts, setPosts] = useState<SearchPost[]>([])
  const { getPostById, addComment, handleTokenExpired, updateLikePost } = usePostContext()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [refesh, setRefesh] = useState(false)
  const navigate = useNavigate()
  const handleOpenComments = (post: Post) => {
    console.log("mo bai viet ")
    setSelectedPost(post)
    setIsCommentsOpen(true)
    setRefesh(!refesh)
  }
  const handleFollowToggle = async (isFollowing: boolean, userID: String) => {
    try {
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
        if (res.status ===200){
          setUsers(users.map(user =>{
            if(user.id !== userID){
              return user
            }
            user.isFollowing=false
            user.totalFollower = user.totalFollower - 1
            return user
          }))
        }
        if (res.data.status === 401) {
          handleTokenExpired()
        }
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
        if (res.status ===200){
          setUsers(users.map(user =>{
            if(user.id !== userID){
              return user
            }
            user.isFollowing=true
            user.totalFollower =  user.totalFollower + 1
            return user
          }))
        }
        if (res.data.status === 401) {
          handleTokenExpired()
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    }
  }
    const handleCloseComments = () => {
      setIsCommentsOpen(false)
      setSelectedPost(null)
    }
    const handleSearch = useCallback(async (query: string) => {
      setSearchQuery(query)

      if (!query.trim()) {
        setUsers([])
        setPosts([])
        return
      }

      setIsSearching(true)
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://localhost:3000/melody/search/`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            searchQuery: query
          }
        })
        const userListFormat = response.data.data.users.map((user: any) => { return { ...user, id: user._id } })
        const ListFormat = response.data.data.posts.map((post: any) => { return { ...post, id: post._id } })
        setUsers(userListFormat || [])
        setPosts(ListFormat || [])

      } catch (err) {
        const error = err as AxiosError
        if (error.response?.status === 401) {
          handleTokenExpired()
        }
        console.error("Search error:", err)

      } finally {
        setIsSearching(false)
      }
    }, [refesh])

    const tabs = [
      { id: "top", label: "Hàng đầu", icon: Search },
      { id: "accounts", label: "Tài khoản", icon: User },
      { id: "posts", label: "Bài viết", icon: BookOpen },
    ]

    return (

        <div className="min-h-screen bg-background">
          {/* Search Header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-5xl mx-auto p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Tìm kiếm người dùng, bài viết ..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary h-11 text-base"
                />
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Recent Searches - Show when no search query */}
            {!searchQuery && (
              <div className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Tìm kiếm gần đây</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-10 px-4 bg-transparent"
                      onClick={() => handleSearch(search)}
                    >
                      <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && (
              <>
                {/* Tabs */}
                <div className="border-b border-border">
                  <div className="flex overflow-x-auto">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <Button
                          key={tab.id}
                          variant="ghost"
                          className={`flex-shrink-0 px-6 py-3 rounded-none border-b-2 transition-colors text-sm font-medium ${activeTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {tab.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Loading State */}
                {isSearching && (
                  <div className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Đang tìm kiếm...</p>
                  </div>
                )}

                {/* Search Results Content */}
                {!isSearching && (
                  <div className="p-6">
                    {/* Top Tab - Mixed Results */}
                    {activeTab === "top" && (
                      <div className="space-y-8">
                        {/* Featured Users */}
                        {users.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-4">Tài khoản</h3>
                            <div className="grid gap-3">
                              {users.slice(0, 3).map((user) => (
                                <Card key={user.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullname} />
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2"
                                        onClick={() => {
                                          navigate(`/homePage/profile/${user.id}`)
                                        }}
                                      >
                                        <p className="font-medium truncate">{user.fullname}</p>
                                      </div>

                                      <p className="text-xs text-muted-foreground">{user.totalFollower} người theo dõi</p>
                                    </div>
                                    {user.id !== localStorage.getItem("userID") && (
                                      user.isFollowing ? (
                                        <Button
                                          size="sm"
                                          onClick={() => handleFollowToggle(true, user.id)}
                                          className="bg-transparent !text-blue-600 hover:!text-blue-700 hover:bg-transparent"
                                        >
                                          Đang theo dõi
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={() => handleFollowToggle(false, user.id)}
                                          className="bg-transparent !text-red-600 hover:!text-red-700 hover:bg-transparent"
                                        >
                                          Theo dõi
                                        </Button>
                                      )
                                    )}

                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Posts Grid */}
                        {posts.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-4">Bài viết</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {posts.slice(0, 6).map((post) => (
                                <div
                                  key={post.id}
                                  className="relative aspect-square group cursor-pointer rounded-lg overflow-hidden"
                                >
                                  <img
                                    src={post.image || "/placeholder.svg"}
                                    alt="Post"
                                    className="w-full h-full object-cover"
                                    onClick={() => {
                                      console.log(post.id)
                                      handleOpenComments(post)
                                    }}
                                  />
                                  {/* <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="flex items-center gap-4 text-white">
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm font-medium">❤️ {post.likeCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm font-medium">💬 {post.commentCount}</span>
                                    </div>
                                  </div>
                                </div> */}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hashtags */}


                        {users.length === 0 && posts.length === 0 && (
                          <div className="text-center py-12">
                            <p className="text-muted-foreground">Không tìm thấy kết quả cho "{searchQuery}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Accounts Tab */}
                    {activeTab === "accounts" && (
                      <div className="grid gap-3">
                        {users.length > 0 ? (
                          users.map((user) => (
                            <Card key={user.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14">
                                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullname} />

                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">{user.fullname}</p>
                                    {/* {user.verified && (
                                    <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                      <div className="h-2.5 w-2.5 bg-primary-foreground rounded-full"></div>
                                    </div>
                                  )} */}
                                  </div>
                                  {/* <p className="text-sm text-muted-foreground truncate">{user.name}</p> */}
                                  <p className="text-xs text-muted-foreground">{user.totalFollower} người theo dõi</p>
                                </div>
                                <Button size="sm" variant="outline" className="flex-shrink-0 bg-transparent">
                                  Theo dõi
                                </Button>
                              </div>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-muted-foreground">Không tìm thấy tài khoản</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Posts Tab */}
                    {activeTab === "posts" && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {posts.length > 0 ? (
                          posts.map((post) => (
                            <div
                              key={post.id}
                              className="relative aspect-square group cursor-pointer rounded-lg overflow-hidden"
                              onClick={() => {
                                console.log(post.id)
                                handleOpenComments(post)
                              }}
                            >
                              <img
                                src={post.image || "/placeholder.svg"}
                                alt="Post"
                                className="w-full h-full object-cover"

                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="flex items-center gap-4 text-white">
                                  <span className="text-sm font-medium">❤️ {post.likeCount}</span>
                                  <span className="text-sm font-medium">💬 {post.commentCount}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground">Không tìm thấy bài viết</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <CommentsOverlay
            post={selectedPost}
            isOpen={isCommentsOpen}
            onClose={handleCloseComments}
            onUpdateComments={addComment}
            updateLikePost={updateLikePost}
          />
        </div>
      
    )
  }
