import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(userID?: string, token?: string) {
  const [socket, setSocket] = useState<Socket | undefined>();
  const isInitializingRef = useRef(false);

  useEffect(() => {
    // Không kết nối nếu thiếu cả userID và token
    if (!userID && !token) {
      setSocket((prev) => {
        try { prev?.disconnect(); } catch {};
        return undefined;
      });
      return;
    }

    // Prevent duplicate initialization
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const socket = io("http://localhost:3000", {
      query: userID ? { userID } : {},
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    setSocket(socket);

    socket.on("connect", () => {
      // console.log(" Connected to socket server:", socket.id);
      console.log("Client Connected:", socket.id, "userID:", userID);

    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connect_error:", err?.message || err);
    });

    return () => {
      try { socket.disconnect(); } catch {}
      isInitializingRef.current = false;
    };
  }, [userID, token]);

  return socket;
}
