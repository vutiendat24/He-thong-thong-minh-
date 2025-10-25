

import CreatePage from "./subPage/CreatePage"
import ExplorePage from "./subPage/ExplorePage"
import PostPage from "./subPage/HomePage"
import NotificationsPage from "./subPage/NotificationsPage"
import ProfilePage from "./subPage/ProfilePage"
import SearchPage from "./subPage/SearchPage"

import type { NavigationPage } from "../../../fomat/type/NavigationPage"
import { useState } from "react"
import CommentsOverlay from "./subPage/CommentOverlay"

interface MainFeedProps {
  currentPage: NavigationPage
}
export default function MainFeed({ currentPage }: MainFeedProps) {
  const [userID, setUserID] = useState<string | null>(null)
  const [postID, setPostID] = useState<string | null>(null)
  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <PostPage />
      case "search":
        return <SearchPage  />
      case "explore":
        return <ExplorePage />
      // case "notifications":
      //   return <NotificationsPage />
      case "create":
        return <CreatePage />
      case "profile":{
        return <ProfilePage  />
      }
        
      default:
        return <PostPage />
    }
  }

  
 
  
  return <div className="flex-1 max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto">{renderPage()}</div>
}