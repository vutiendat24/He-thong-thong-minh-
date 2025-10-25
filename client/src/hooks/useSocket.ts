import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(userID: string) {
  // const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket>()

  useEffect(() => {
    const socket = io("http://localhost:3000", {
      query: { userID }, // gửi userID lên server nếu cần
      transports: ["websocket"],
    });
    setSocket(socket);

    socket.on("connect", () => {
      // console.log(" Connected to socket server:", socket.id);
      console.log(" Connected:", socket.id, "userID:", userID);
    });

    socket.on("disconnect", () => {
      console.log(" Disconnected from socket server");
    });

    return () => {
      socket.disconnect();
    };
  }, [userID]);
  return socket;
}
