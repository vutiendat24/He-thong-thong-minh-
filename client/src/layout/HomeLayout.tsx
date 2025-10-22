"use client"

import { useState } from "react"
// Update the import path if the file is named differently or located elsewhere
import LeftSidebar from "../components/Home/LeftSidebar"
import MainFeed from "../components/Home/MainFeed/MainFeed"
import RightSidebar from "../components/Home/RightSidebar"
import type { NavigationPage } from "../fomat/type/NavigationPage"

import {PostProvider} from "../context/PostContext"
import { Outlet } from "react-router-dom"



export default function HomeLayout() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>("home")

  return (

    <PostProvider>
      <div className="h-screen w-screen flex bg-white">
        <LeftSidebar currentPage={currentPage} onNavigate={setCurrentPage} />

        {/* Main Content Area - Responsive */}
        <div className="flex-1 ml-16 lg:ml-56 xl:ml-64 2xl:ml-72 transition-all duration-300">
          <div className="flex">
            <div className="flex-1 max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto">
              <Outlet />
            </div>
            <RightSidebar />
          </div>
        </div>
      </div>
    </PostProvider>
  )
}
