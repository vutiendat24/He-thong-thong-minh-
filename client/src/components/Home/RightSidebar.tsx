 

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { usePostContext } from "@/context/PostContext"
import type { PersonalInfo } from "@/fomat/type/PersonalInfo"
import type { SuggestUser } from "@/fomat/type/SuggestUser"
import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function RightSidebar() {


  const navigate = useNavigate()
  const { handleTokenExpired } = usePostContext()
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestUser[]>([])
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>()
  const [navigateUser, setNavigateUser] = useState("")
  const getSuggestedUsers = async () => {
    const apiRes = await axios.get("http://localhost:3000/melody/profile/suggest-friend", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
    if (apiRes.data.success === true) {
      setSuggestedUsers(apiRes.data.data)
    }
  }
  const getPersonalUsers = async () => {
    const apiRes = await axios.get(`http://localhost:3000/melody/profile/get-profile/${localStorage.getItem("userID")}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
    if (apiRes.data.success === true) {
      setPersonalInfo(apiRes.data.data)
    }
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
        if (res.status === 200) {
          setSuggestedUsers(suggestedUsers.map(user => {
            if (user.id !== userID) {
              return user
            }
            user.isFollowing = false
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
        if (res.status === 200) {
          setSuggestedUsers(suggestedUsers.map(user => {
            if (user.id !== userID) {
              return user
            }
            user.isFollowing = true
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
  useEffect(() => {
    getSuggestedUsers();
    getPersonalUsers()
    console.log("sdsadsadasdasd", personalInfo)
  }, [])
  return (
    <div className="hidden xl:block w-72 2xl:w-80 border-l border-gray-200 transition-all duration-300">
      <div className="h-screen overflow-y-auto scrollbar-hide">
        <div className="p-4 xl:p-6">
          {/* Current User */}
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="h-12 xl:h-14 w-12 xl:w-14"
              onClick={() => navigate(`/homePage/profile/${personalInfo?.id}`)}
            >
              <AvatarImage src={personalInfo?.avatar} />
              <AvatarFallback>YU</AvatarFallback>

            </Avatar>
            <div className="flex-1 ">
              <p className="text-xs xl:text-sm text-gray-500 truncate cursor-pointer hover:underline"
                onClick={() => {navigate(`/homePage/profile/${personalInfo?.id}`); }}
              >
                {personalInfo?.fullname}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-500 font-semibold text-xs xl:text-sm"
              onClick={() => {
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
                  <Avatar className="h-8 w-8"
                    onClick={() => {
                      setNavigateUser(user?.id)
                      navigate(`/homePage/profile/${user?.id}`); 
                    }}
                  >
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user.fullname[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0"
                  onClick={() => {
                    setNavigateUser(user?.id)
                      navigate(`/homePage/profile/${user?.id}`); 
                    }}
                  >
                    <p className="font-semibold text-sm truncate cursor-pointer hover:underline">{user.fullname}</p>
                    <p className="text-xs text-gray-500">{user.mutualFriends ? `${user.mutualFriends} bạn chung` : "Bạn mới "} </p>
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
              ))}
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}
