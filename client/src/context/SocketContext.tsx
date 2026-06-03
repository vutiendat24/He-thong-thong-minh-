import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  useCallback,
  useRef,
} from "react";
import { useSocket } from "@/hooks/useSocket";
import { useCallManager } from "@/hooks/useCallManager";

interface CallState {
  status: "idle" | "calling" | "ringing" | "connected" | "ended";
  remoteUserId?: string;
  callType?: "audio" | "video";
  duration?: number;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isRemoteVideoEnabled?: boolean;
  isCaller?: boolean;
  remoteUserName?: string;
  remoteUserAvatar?: string;
  offer?: any;
}

const SocketContext = createContext<any>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [userID, setUserID] = useState<string | null>(() => {
    return localStorage.getItem("userID");
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const [callState, setCallState] = useState<CallState>({ status: "idle", isMuted: false, isVideoEnabled: true, isRemoteVideoEnabled: true, isCaller: undefined });
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const socket = useSocket(userID ?? undefined, token ?? undefined);

  const callManager = useCallManager({
    socket,
    localUserId: userID ?? undefined,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
  });

  // keep sync with localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const uid = localStorage.getItem("userID");
      const tk = localStorage.getItem("token");

      if (uid !== userID) setUserID(uid);
      if (tk !== token) setToken(tk);

      // nếu thiếu userID nhưng có token, decode để lấy userID
      if (!uid && tk) {
        try {
          const parts = tk.split(".");
          if (parts.length >= 2) {
            const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const json = decodeURIComponent(
              atob(payload)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            );
            const obj = JSON.parse(json);
            const decodedId = obj?.id ?? obj?._id ?? obj?.userId ?? obj?.userID ?? null;
            if (decodedId) {
              setUserID(String(decodedId));
              try { localStorage.setItem("userID", String(decodedId)); } catch {}
            }
          }
        } catch {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userID, token]);

  // ============= SOCKET LISTENERS ============= //
  useEffect(() => {
    if (!socket || !callManager) return;

    // A gọi B → B nhận được event này
    const onIncoming = async (payload: any) => {
      const { from, offer, callType, fromName, fromAvatar } = payload;

      console.log("📞 Incoming call:", payload);

      setCallState({
        status: "ringing",
        remoteUserId: from,
        callType,
        remoteUserName: fromName,
        remoteUserAvatar: fromAvatar,
        offer,
      });
    };

    // A → gửi offer → B → B accept → A nhận accepted
    const onAccepted = async (payload: any) => {
      const { answer } = payload;
      console.log("✅ Call accepted by remote");

      await callManager.handleAnswer(answer);
      setCallState((prev) => ({ ...prev, status: "connected" }));
    };

    // ICE candidate
    const onIceCandidate = async (payload: any) => {
      const { candidate } = payload;
      if (candidate) await callManager.handleIceCandidate(candidate);
    };

    const onCallEnded = () => {
      console.log("📞 Call ended");
      callManager.endCall();
      setCallState({ status: "idle" });
    };

    const onCallRejected = () => {
      console.log("❌ Call rejected");
      setCallState({ status: "idle" });
    };

    // Remote toggled camera
    const onRemoteVideoToggled = (payload: any) => {
      const { enabled } = payload || {};
      setCallState((prev) => ({ ...prev, isRemoteVideoEnabled: !!enabled }));
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:ended", onCallEnded);
    socket.on("call:rejected", onCallRejected);
    socket.on("call:video-toggled", onRemoteVideoToggled);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:ended", onCallEnded);
      socket.off("call:rejected", onCallRejected);
      socket.off("call:video-toggled", onRemoteVideoToggled);
    };
  }, [socket, callManager]);

  // Ensure media elements play after UI mounts on 'connected'
  useEffect(() => {
    if (callState.status !== "connected") return;
    try {
      const v = remoteVideoRef.current as HTMLVideoElement | null;
      if (v && v.srcObject) {
        const p = v.play();
        if (p && typeof (p as any).catch === "function") {
          (p as Promise<void>).catch(() => {});
        }
      }
    } catch {}
    try {
      const a = remoteAudioRef.current as HTMLAudioElement | null;
      if (a && a.srcObject) {
        const p2 = a.play();
        if (p2 && typeof (p2 as any).catch === "function") {
          (p2 as Promise<void>).catch(() => {});
        }
      }
    } catch {}
    try {
      callManager?.attachRemoteMedia?.();
    } catch {}
  }, [callState.status]);

  // Re-attach local preview when turning camera back ON
  useEffect(() => {
    if (!callManager) return;
    if (callState.isVideoEnabled) {
      try { callManager.attachLocalPreview?.(); } catch {}
    }
  }, [callManager, callState.isVideoEnabled]);

  // ============= ACTIONS ============= //

  /** Bắt đầu gọi: dùng chung socket + WebRTC trong callManager */
  const initiateCall = (receiverId: string, callType: "audio" | "video") => {
    if (!callManager) return Promise.reject("CallManager unavailable");
    setCallState({ status: "calling", remoteUserId: receiverId, callType, isMuted: false, isVideoEnabled: true, isCaller: true });

    // Lấy tên và avatar người nhận để hiển thị đúng trên UI phía người gọi
    const tokenHeader = token ? { Authorization: `Bearer ${token}` } : undefined;
    fetch(`http://localhost:3000/melody/profile/get-profile/${receiverId}`, {
      headers: {
        ...(tokenHeader || {}),
      },
    })
      .then(async (res) => {
        try {
          const json = await res.json();
          const info = json?.data || json;
          const fullname = info?.fullname || info?.name || undefined;
          const avatar = info?.avatar || undefined;
          if (fullname || avatar) {
            setCallState((prev) => ({ ...prev, remoteUserName: fullname, remoteUserAvatar: avatar }));
          }
        } catch {}
      })
      .catch(() => {});

    return callManager
      .initiateCall(receiverId, callType)
      .catch((err) => {
        setCallState({ status: "idle" });
        throw err;
      });
  };

  /** Bấm Accept */
  const acceptCall = useCallback(
    async (from: string, callType: "video" | "audio", offer: any) => {
      try {
        await callManager.acceptCall(from, callType, offer);
        setCallState((prev) => ({ ...prev, status: "connected", isCaller: false }));
      } catch (err) {
        console.error("Accept error:", err);
        setCallState({ status: "idle" });
      }
    },
    [socket, callManager, userID]
  );

  /** Bấm Từ chối */
  const rejectCall = useCallback(
    (from: string) => {
      socket?.emit("call:reject", { to: from });
      setCallState({ status: "idle" });
    },
    [socket]
  );

  /** Kết thúc cuộc gọi */
  const endCall = useCallback(
    (to?: string) => {
      callManager.endCall();

      if (to) socket?.emit("call:end", { to });

      setCallState({ status: "idle" });
    },
    [socket, callManager]
  );

  /** Mute mic */
  const toggleAudio = useCallback(() => {
    callManager.toggleAudio();
    setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, [callManager]);

  /** Tắt cam */
  const toggleVideo = useCallback(() => {
    callManager.toggleVideo();
    setCallState((prev) => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
  }, [callManager]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        userID,
        token,
        callState,
        setCallState,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleAudio,
        toggleVideo,
        localVideoRef,
        remoteVideoRef,
        remoteAudioRef,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}
