

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'



import LoginForm from './pages/login/login'
import SignUp from './pages/login/signup'
import './App.css'
import HomePage from './pages/HomePage'
import MessagePage from '../src/pages/MessagePage'
import CallPage from './pages/CallPage'
import CallOverlay from './components/Call/CallOverlay'
import CallWindow from './components/Call/CallWindow'
import ProfilePage from './components/Home/MainFeed/subPage/ProfilePage'
import PostPage from './components/Home/MainFeed/subPage/HomePage'
import SearchPage from './components/Home/MainFeed/subPage/SearchPage'
import ExplorePage from './components/Home/MainFeed/subPage/ExplorePage'
import NotificationsPage from './components/Home/MainFeed/subPage/NotificationsPage'
import CreatePage from './components/Home/MainFeed/subPage/CreatePage'

// import AdminDashboard from './pages/AdminPage'
import { NotificationProvider } from './context/NotificationContext'
import AdminLayout from './layout/AdminLayout'
import Dashboard from './pages/adminPages/Dashboard'
import UserManagement from './pages/adminPages/UserManagement'
import ContentModeration from './pages/adminPages/ContentModeration'
import HotContent from './pages/adminPages/HotContent'

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

    <>
      <CallOverlay />
      <CallWindow />
      <Routes>
        <Route path="/homePage" element={<HomePage />} >
          <Route path="home" element={<PostPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="notifications" element={
            <NotificationProvider>
              <NotificationsPage />
            </NotificationProvider>} 
          />
          <Route path="create" element={<CreatePage />} />
          <Route path="profile/:userID" element={<ProfilePage />} />
        </Route>

        {/* <Route path="admin" element={<AdminDashboard />} /> */}
        {/* <Route path="/admin" element={
          <AdminProvider>
            <AdminLayout />  
          </AdminProvider>
        }
        >
          <Route index element={<OverviewPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="posts" element={<PostsAdminPage />} />
          <Route path="comments" element={<CommentsPage />} />

        </Route> */}
          <Route path='/admin'  element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="content" element={<ContentModeration />} />
            {/* <Route path="/reports" element={<ReportManagement />} /> */}
            <Route path="hot-content" element={<HotContent />} />
          </Route>


        <Route path="/messages" element={<PrivateRoute><MessagePage /></PrivateRoute>} />
        <Route path="/call/:callId" element={<PrivateRoute><CallPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />

        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<LoginForm />} />
        <Route path="/messages" element={<MessagePage />} />
      </Routes>
    </>

  )

}



export default App
