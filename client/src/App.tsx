

import { Routes,Route } from 'react-router-dom'



import LoginForm from './pages/login/login'
import SignUp from './pages/login/signup'
import './App.css'
import HomePage from './pages/HomePage'
import MessagePage from '../src/pages/MessagePage'



function  App() {
  return (
  
      <Routes>
        <Route path="/homePage" element={<HomePage/>} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<LoginForm />} />
        <Route path="/messages" element={<MessagePage />} />
      </Routes>
     
  )
}



export default App
