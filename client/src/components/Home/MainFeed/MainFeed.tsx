

import CreatePage from "./subPage/CreatePage"
import ExplorePage from "./subPage/ExplorePage"
import HomePage from "./subPage/HomePage"
import NotificationsPage from "./subPage/NotificationsPage"
import ProfilePage from "./subPage/ProfilePage"
import SearchPage from "./subPage/SearchPage"

import type { NavigationPage } from "../../../fomat/type/NavigationPage"

interface MainFeedProps {
  currentPage: NavigationPage
}
export default function MainFeed({ currentPage }: MainFeedProps) {

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />
      case "search":
        return <SearchPage />
      case "explore":
        return <ExplorePage />
      case "notifications":
        return <NotificationsPage />
      case "create":
        return <CreatePage />
      case "profile":{
        const userID = localStorage.getItem("userID") || ""
        return <ProfilePage userID = {userID}  />
      }
        
      default:
        return <HomePage />
    }
  }
  
  return <div className="flex-1 max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto">{renderPage()}</div>
}