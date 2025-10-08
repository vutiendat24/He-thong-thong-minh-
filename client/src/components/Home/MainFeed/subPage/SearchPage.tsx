"use client"

import { useState } from "react"
import { Search, Hash, MapPin, User, Heart, MessageCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock data
const mockPosts = [
  { id: 1, image: "./src/assets/coffee-art.jpg", likes: 1234, comments: 56 },
  { id: 2, image: "./src/assets/hinh-avatar-cute-nu.webp", likes: 892, comments: 23 },
  { id: 3, image: "./src/assets/vibrant-street-art.png", likes: 2156, comments: 89 },
  { id: 4, image: "./src/assets/vibrant-pasta-dish.png", likes: 3421, comments: 134 },
  { id: 5, image: "./src/assets/romanWarrior.jpg", likes: 1876, comments: 67 },
  { id: 6, image: "./src/assets/loginImg.jpg", likes: 945, comments: 34 },
  { id: 7, image: "./src/assets/ruaBien.png", likes: 2789, comments: 156 },
  { id: 8, image: "./src/assets/sunset-beach-tranquil.png", likes: 4123, comments: 234 },
  { id: 9, image: "./src/assets/vibrant-street-art.png", likes: 1567, comments: 78 },
]

const mockUsers = [
  {
    id: 1,
    fullname: "nguyenvan_a",
    name: "Nguyễn Văn A",
    followers: "12.5k",
    avatar: "/thoughtful-man.png",
    verified: true,
  },
  {
    id: 2,
    fullname: "thithib",
    name: "Thị Thị B",
    followers: "8.2k",
    avatar: "/thoughtful-woman.png",
    verified: false,
  },
  {
    id: 3,
    fullname: "photographer_c",
    name: "Photographer C",
    followers: "45.1k",
    avatar: "/photographer.png",
    verified: true,
  },
  {
    id: 4,
    fullname: "foodie_d",
    name: "Food Lover D",
    followers: "23.7k",
    avatar: "/diverse-chef-preparing-food.png",
    verified: false,
  },
]

const mockHashtags = [
  { id: 1, tag: "vietnam", posts: "2.1M" },
  { id: 2, tag: "saigon", posts: "856K" },
  { id: 3, tag: "hanoi", posts: "634K" },
  { id: 4, tag: "photography", posts: "1.8M" },
  { id: 5, tag: "food", posts: "3.2M" },
  { id: 6, tag: "travel", posts: "4.5M" },
]

const recentSearches = ["nguyenvan_a", "#vietnam", "coffee", "#photography", "hanoi"]

export default function InstagramSearch() {
  const [activeTab, setActiveTab] = useState("top")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const tabs = [
    { id: "top", label: "Hàng đầu", icon: Search },
    { id: "accounts", label: "Tài khoản", icon: User },
    { id: "hashtags", label: "Hashtag", icon: Hash },
    { id: "places", label: "Địa điểm", icon: MapPin },
  ]

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 500)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Recent Searches - Show when no search query */}
        {!searchQuery && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Tìm kiếm gần đây</h3>
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => handleSearch(search)}
                >
                  <Search className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span>{search}</span>
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
                      className={`flex-shrink-0 px-6 py-3 rounded-none border-b-2 transition-colors ${
                        activeTab === tab.id
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
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Đang tìm kiếm...</p>
              </div>
            )}

            {/* Search Results Content */}
            {!isSearching && (
              <div className="p-4">
                {/* Top Tab - Mixed Results */}
                {activeTab === "top" && (
                  <div className="space-y-6">
                    {/* Featured Users */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Tài khoản</h3>
                      <div className="grid gap-3">
                        {mockUsers.slice(0, 3).map((user) => (
                          <Card key={user.id} className="p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullname} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="font-medium truncate">{user.fullname}</p>
                                  {user.verified && (
                                    <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                                      <div className="h-2 w-2 bg-primary-foreground rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.followers} người theo dõi</p>
                              </div>
                              <Button size="sm" variant="outline">
                                Theo dõi
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Posts Grid */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Bài viết</h3>
                      <div className="grid grid-cols-3 gap-1">
                        {mockPosts.slice(0, 6).map((post) => (
                          <div key={post.id} className="relative aspect-square group cursor-pointer">
                            <img
                              src={post.image || "/placeholder.svg"}
                              alt="Post"
                              className="w-full h-full object-cover rounded-sm"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm flex items-center justify-center">
                              <div className="flex items-center gap-4 text-white">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-5 w-5 fill-current" />
                                  <span className="text-sm font-medium">{post.likes.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-5 w-5 fill-current" />
                                  <span className="text-sm font-medium">{post.comments}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Accounts Tab */}
                {activeTab === "accounts" && (
                  <div className="grid gap-3">
                    {mockUsers.map((user) => (
                      <Card key={user.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullname} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{user.fullname}</p>
                              {user.verified && (
                                <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                                  <div className="h-2.5 w-2.5 bg-primary-foreground rounded-full"></div>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.followers} người theo dõi</p>
                          </div>
                          <Button size="sm" variant="outline">
                            Theo dõi
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Hashtags Tab */}
                {activeTab === "hashtags" && (
                  <div className="grid gap-3">
                    {mockHashtags.map((hashtag) => (
                      <Card key={hashtag.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                            <Hash className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">#{hashtag.tag}</p>
                            <p className="text-sm text-muted-foreground">{hashtag.posts} bài viết</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Places Tab */}
                {activeTab === "places" && (
                  <div className="grid gap-3">
                    {[
                      { name: "Hồ Chí Minh City", posts: "1.2M" },
                      { name: "Hà Nội", posts: "856K" },
                      { name: "Đà Nẵng", posts: "423K" },
                      { name: "Hội An", posts: "234K" },
                    ].map((place, index) => (
                      <Card key={index} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{place.name}</p>
                            <p className="text-sm text-muted-foreground">{place.posts} bài viết</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
