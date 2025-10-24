import { Routes, Route, Navigate, useLocation } from 'react-router-dom'



import LoginForm from './pages/login/login'
import SignUp from './pages/login/signup'
import './App.css'
import HomePage from './pages/HomePage'
import MessagePage from '../src/pages/MessagePage'



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
      {/* Public routes */}
      <Route path="/" element={<LoginForm />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected routes (require token) */}
      <Route path="/homePage" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/messages" element={<PrivateRoute><MessagePage /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}



export default App
