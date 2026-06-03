import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'


const userID = localStorage.getItem("userID") || ""
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* <SocketProvider userID={userID}> */}
      <SocketProvider >
        
          <App />
        
      </SocketProvider>
    </BrowserRouter>
  </StrictMode>,
)
