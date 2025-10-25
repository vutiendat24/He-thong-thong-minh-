import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext.tsx'


const userID = localStorage.getItem("userID") || ""
console.log("userID", userID)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SocketProvider userID={userID}>
        <App />
      </SocketProvider>
    </BrowserRouter>
  </StrictMode>,
)
