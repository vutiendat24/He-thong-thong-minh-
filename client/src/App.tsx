

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'



import LoginForm from './pages/login/login'
import SignUp from './pages/login/signup'
import './App.css'
import HomePage from './pages/HomePage'
import MessagePage from '../src/pages/MessagePage'
import ProfilePage from './components/Home/MainFeed/subPage/ProfilePage'
import PostPage from './components/Home/MainFeed/subPage/HomePage'
import SearchPage from './components/Home/MainFeed/subPage/SearchPage'
import ExplorePage from './components/Home/MainFeed/subPage/ExplorePage'
import NotificationsPage from './components/Home/MainFeed/subPage/NotificationsPage'
import CreatePage from './components/Home/MainFeed/subPage/CreatePage'



function PrivateRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}

function App() {

  
  return (
    <Routes>      
      <Route path="/homePage" element={<HomePage />} >
        <Route path="home" element={<PostPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="notifications" element={<NotificationsPage  />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="profile/:userID" element={<ProfilePage />} />
      </Route>

      <Route path="/messages" element={<PrivateRoute><MessagePage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/signup" element={<SignUp />} />
      <Route path="/" element={<LoginForm />} />
      <Route path="/messages" element={<MessagePage />} />
    </Routes>

  )

}



export default App
