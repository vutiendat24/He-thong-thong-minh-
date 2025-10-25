import React, { useState, useEffect, useContext, createContext } from "react";
import { useSocket } from "@/hooks/useSocket";

const SocketContext = createContext<any>(null)


export function SocketProvider({ userID, children }: {
  userID: string,
  children: React.ReactNode
}) {
  
  const socket = useSocket(userID)

  return (
    <SocketContext.Provider value={{socket}}>
      {children}
    </SocketContext.Provider>

  )
}

export function useSocketContext (){
  const socket = useContext(SocketContext)
  return socket
}


 



