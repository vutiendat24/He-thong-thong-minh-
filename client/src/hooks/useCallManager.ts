import { useRef, useState, useCallback, useEffect } from 'react';

export interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  remoteUserId?: string;
  callType?: 'audio' | 'video';
  duration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  lastError?: string;
}

interface UseCallManagerProps {
  socket?: any;
  localUserId?: string;
  localVideoRef?: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef?: React.RefObject<HTMLVideoElement | null>;
  remoteAudioRef?: React.RefObject<HTMLAudioElement | null>;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useCallManager({ socket, localUserId, localVideoRef, remoteVideoRef, remoteAudioRef }: UseCallManagerProps) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const remoteUserIdRef = useRef<string | undefined>(undefined);

  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    duration: 0,
    isMuted: false,
    isVideoEnabled: true,
    lastError: undefined,
  });

  // keep remoteUserIdRef in sync with state
  useEffect(() => {
    remoteUserIdRef.current = callState.remoteUserId;
  }, [callState.remoteUserId]);

  // Initialize local media
  const getLocalMedia = useCallback(async (audio = true, video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Failed to get local media:', err);
      throw err;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // use ref to avoid stale callState when sending candidate
          socket?.emit('call:ice-candidate', {
            to: remoteUserIdRef.current,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log('ontrack received:', event.track?.kind, 'streams:', event.streams?.length || 0);
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(event.track);
        if (event.track.kind === 'video' && remoteVideoRef?.current) {
          remoteVideoRef.current.srcObject = event.streams?.[0] || remoteStreamRef.current;
          try {
            const v = remoteVideoRef.current as HTMLVideoElement;
            v.playsInline = true;
            const p = v.play();
            if (p && typeof (p as any).catch === 'function') {
              (p as Promise<void>).catch((e) => console.warn('remote video play failed:', e));
            }
          } catch (e) {
            console.warn('remote video play failed:', e);
          }
        }
        if (event.track.kind === 'audio' && remoteAudioRef?.current) {
          remoteAudioRef.current.srcObject = event.streams?.[0] || remoteStreamRef.current;
          try {
            const a = remoteAudioRef.current as HTMLAudioElement;
            a.muted = false;
            a.volume = 1.0;
            const p = a.play();
            if (p && typeof (p as any).catch === 'function') {
              (p as Promise<void>).catch((e) => console.warn('remote audio play failed:', e));
            }
          } catch (e) {
            console.warn('remote audio play failed:', e);
          }
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          endCall();
        }
      };

      // Do not auto-add local tracks here; tracks are added in addLocalStream()

      return pc;
    } catch (err) {
      console.error('Failed to create peer connection:', err);
      throw err;
    }
  }, [socket, remoteVideoRef]); // removed callState.remoteUserId to avoid stale deps

  // Add local stream to peer connection
  const addLocalStream = useCallback(async (videoEnabled = true) => {
    if (!localStreamRef.current || !pcRef.current) return;

    localStreamRef.current.getTracks().forEach((track) => {
      if (track.kind === 'video' && !videoEnabled) {
        track.enabled = false;
        return;
      }
      const alreadyHasSender = !!pcRef.current?.getSenders().some((s) => s.track && s.track.id === track.id);
      if (alreadyHasSender) return;
      try {
        pcRef.current!.addTrack(track, localStreamRef.current!);
      } catch (e) {
        console.warn('addTrack failed:', e);
      }
    });

    if (localVideoRef?.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      try {
        const lv = localVideoRef.current as HTMLVideoElement;
        lv.playsInline = true;
        lv.muted = true;
        const p = lv.play();
        if (p && typeof (p as any).catch === 'function') {
          (p as Promise<void>).catch((e) => console.warn('local preview play failed:', e));
        }
      } catch (e) {
        console.warn('local preview play failed:', e);
      }
    }
  }, [localVideoRef]);

  // Create and send offer
  const createOffer = useCallback(async (remoteUserId?: string, callTypeArg?: 'audio' | 'video') => {
    if (!pcRef.current) {
      console.warn('❌ createOffer: pcRef.current is null');
      return null;
    }

    try {
      console.log('🎙️ createOffer: Creating WebRTC offer...', { remoteUserId, callTypeArg, socketConnected: !!socket });
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      const payload = {
        to: remoteUserId ?? callState.remoteUserId,
        from: localUserId,
        callType: callTypeArg ?? callState.callType,
        offer: offer,
      };
      console.log('📤 createOffer: Emitting call:initiate payload', payload);
      if (!socket) {
        console.error('❌ createOffer: socket is undefined! Cannot emit call:initiate');
        throw new Error('Socket not connected');
      }
      socket.emit('call:initiate', payload);
      console.log('✅ createOffer: call:initiate emitted');

      return offer;
    } catch (err) {
      console.error('❌ Failed to create offer:', err);
      throw err;
    }
  }, [socket, localUserId, callState.remoteUserId, callState.callType]);

  // Handle incoming offer and send answer to caller.
  // Accepts optional `to` param to avoid relying on stale internal state.
  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit, to?: string) => {
      if (!pcRef.current) return;

      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);

        const target = to ?? callState.remoteUserId;
        socket?.emit('call:accept', {
          to: target,
          answer: answer,
        });

        setCallState((prev) => ({ ...prev, status: 'connected' }));
      } catch (err) {
        console.error('Failed to handle offer:', err);
        throw err;
      }
    },
    [socket, callState.remoteUserId]
  );

  // Handle incoming answer
  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      if (!pcRef.current) return;

      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState((prev) => ({ ...prev, status: 'connected' }));
      } catch (err) {
        console.error('Failed to handle answer:', err);
        throw err;
      }
    },
    []
  );

  // Handle ICE candidate
  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      if (!pcRef.current) return;

      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Failed to add ICE candidate:', err);
      }
    },
    []
  );

  // Attach remote media to DOM elements explicitly
  const attachRemoteMedia = useCallback(() => {
    const stream = remoteStreamRef.current;
    if (!stream) return;
    if (remoteVideoRef?.current) {
      try {
        const v = remoteVideoRef.current as HTMLVideoElement;
        v.srcObject = stream;
        v.playsInline = true;
        const p = v.play();
        if (p && typeof (p as any).catch === 'function') {
          (p as Promise<void>).catch(() => {});
        }
      } catch {}
    }
    if (remoteAudioRef?.current) {
      try {
        const a = remoteAudioRef.current as HTMLAudioElement;
        a.srcObject = stream;
        a.muted = false;
        a.volume = 1.0;
        const p2 = a.play();
        if (p2 && typeof (p2 as any).catch === 'function') {
          (p2 as Promise<void>).catch(() => {});
        }
      } catch {}
    }
  }, [remoteVideoRef, remoteAudioRef]);

  // Attach local preview explicitly (useful after re-mount when cam toggled back on)
  const attachLocalPreview = useCallback(() => {
    if (!localStreamRef.current || !localVideoRef?.current) return;
    try {
      const lv = localVideoRef.current as HTMLVideoElement;
      lv.srcObject = localStreamRef.current;
      lv.playsInline = true;
      lv.muted = true;
      const p = lv.play();
      if (p && typeof (p as any).catch === 'function') {
        (p as Promise<void>).catch(() => {});
      }
    } catch {}
  }, [localVideoRef]);

  // Initiate call
  const initiateCall = useCallback(
    async (remoteUserId: string, callType: 'audio' | 'video') => {
      console.log('📞 initiateCall: Starting call...', { remoteUserId, callType, socket: !!socket });
      try {
        // Skip friend discovery for now - direct call to user
        console.log('🔍 initiateCall: Skipping friend discovery (direct call enabled)');

        // Validate required parameters
        if (!remoteUserId) {
          throw new Error('Remote user ID is required');
        }
        if (!socket?.connected) {
          throw new Error('Socket not connected');
        }
        if (!localUserId) {
          throw new Error('Local user ID not available');
        }

        // ensure ref is set immediately so ICE/other emits target correct
        remoteUserIdRef.current = remoteUserId;

        setCallState((prev) => ({
          ...prev,
          status: 'calling',
          remoteUserId,
          callType,
        }));

        console.log('🎤 initiateCall: Getting local media...');
        try {
          await getLocalMedia(true, callType === 'video');
          console.log('✅ initiateCall: Local media acquired');
        } catch (mediaErr) {
          console.warn('⚠️ initiateCall: Local media unavailable, proceeding without tracks:', mediaErr);
          setCallState((prev) => ({ ...prev, lastError: 'Thiết bị mic/camera đang bận hoặc bị chặn' }));
        }
        
        console.log('🔗 initiateCall: Creating peer connection...');
        createPeerConnection();
        console.log('✅ initiateCall: Peer connection created');
        
        if (localStreamRef.current) {
          console.log('➕ initiateCall: Adding local stream...');
          await addLocalStream(callType === 'video');
          console.log('✅ initiateCall: Local stream added');
        } else {
          console.log('ℹ️ initiateCall: No local stream, creating offer without tracks');
        }
        
        console.log('🎙️ initiateCall: Creating offer...');
        await createOffer(remoteUserId, callType);
        console.log('✅ initiateCall: Offer created and sent');

        startCallTimer();
      } catch (err) {
        console.error('❌ Failed to initiate call:', err);
        setCallState((prev) => ({ ...prev, lastError: String((err as any)?.message ?? err) }));
        throw err;
      }
    },
    [getLocalMedia, createPeerConnection, addLocalStream, createOffer]
  );

  // Accept call
  const acceptCall = useCallback(
    async (remoteUserId: string, callType: 'audio' | 'video', offer: RTCSessionDescriptionInit) => {
      try {
        // ensure internal state has remoteUserId so emit uses correct target
        setCallState((prev) => ({ ...prev, remoteUserId, callType }));
        // set ref immediately to avoid races with socket emissions
        remoteUserIdRef.current = remoteUserId;

        try {
          await getLocalMedia(true, callType === 'video');
          console.log('✅ acceptCall: Local media acquired');
        } catch (mediaErr) {
          console.warn('⚠️ acceptCall: Local media unavailable, proceeding without tracks:', mediaErr);
          setCallState((prev) => ({ ...prev, lastError: 'Thiết bị mic/camera đang bận hoặc bị chặn' }));
        }
        createPeerConnection();
        if (localStreamRef.current) {
          await addLocalStream(callType === 'video');
        }
        // pass remoteUserId explicitly to avoid stale state issues
        await handleOffer(offer, remoteUserId);

        setCallState((prev) => ({
          ...prev,
          remoteUserId,
          callType,
          status: 'connected',
        }));

        startCallTimer();
      } catch (err) {
        console.error('Failed to accept call:', err);
        throw err;
      }
    },
    [getLocalMedia, createPeerConnection, addLocalStream, handleOffer]
  );

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    const newState = !callState.isMuted;

    audioTracks.forEach((track) => {
      track.enabled = !newState;
    });

    setCallState((prev) => ({ ...prev, isMuted: newState }));
    socket?.emit('call:toggle-audio', {
      to: callState.remoteUserId,
      enabled: !newState,
    });
  }, [socket, callState.isMuted, callState.remoteUserId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;

    const videoTracks = localStreamRef.current.getVideoTracks();
    const newState = !callState.isVideoEnabled;

    videoTracks.forEach((track) => {
      track.enabled = newState;
    });

    // when turning video back on, ensure local preview element re-attaches stream and plays
    if (newState && localVideoRef?.current) {
      try {
        const lv = localVideoRef.current as HTMLVideoElement;
        lv.srcObject = localStreamRef.current;
        lv.playsInline = true;
        lv.muted = true;
        const p = lv.play();
        if (p && typeof (p as any).catch === 'function') {
          (p as Promise<void>).catch(() => {});
        }
      } catch {}
    }

    setCallState((prev) => ({ ...prev, isVideoEnabled: newState }));
    socket?.emit('call:toggle-video', {
      to: callState.remoteUserId,
      enabled: newState,
    });
  }, [socket, callState.isVideoEnabled, callState.remoteUserId]);

  // Start call timer
  const startCallTimer = useCallback(() => {
    // ensure any previous timer is cleared and duration reset
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setCallState((prev) => ({ ...prev, duration: 0 }));
    // window.setInterval returns number in browsers
    durationIntervalRef.current = window.setInterval(() => {
      setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000) as unknown as number;
  }, []);

  // End call
  const endCall = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());

    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    socket?.emit('call:end', { to: callState.remoteUserId });

    setCallState({
      status: 'idle',
      duration: 0,
      isMuted: false,
      isVideoEnabled: true,
      lastError: undefined,
    });
  }, [socket, callState.remoteUserId]);

  // Reject call
  const rejectCall = useCallback(
    (remoteUserId: string) => {
      socket?.emit('call:reject', { to: remoteUserId });
      setCallState({
        status: 'idle',
        duration: 0,
        isMuted: false,
        isVideoEnabled: true,
        lastError: undefined,
      });
    },
    [socket]
  );

  // Helper: resolve friend / discovery with retries; try socket ack then fallback to fetch
  const resolveFriend = useCallback(
    async (targetId: string) => {
      const maxAttempts = 3;
      let attempt = 0;
      let delay = 500;
      while (attempt < maxAttempts) {
        try {
          // prefer socket ack if available
          if (socket && socket.emit) {
            const ids: string[] = await new Promise((resolve, reject) => {
              // server should ack with (err, { ids: [...] }) or similar
              socket.emit('friends:discover', { userId: localUserId }, (err: any, res: any) => {
                if (err) return reject(err);
                return resolve(res?.ids ?? res ?? []);
              });
            });
            if (Array.isArray(ids) && ids.includes(targetId)) return true;
            throw new Error('Friend not found via discovery');
          }

          // fallback to http endpoint if socket not available
          const resp = await fetch('/api/friends');
          if (!resp.ok) throw new Error('Friends fetch failed');
          const data = await resp.json();
          const ids = data?.ids ?? [];
          if (Array.isArray(ids) && ids.includes(targetId)) return true;
          throw new Error('Friend not found via fetch');
        } catch (err: any) {
          attempt++;
          if (attempt >= maxAttempts) throw err;
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
        }
      }
      return false;
    },
    [socket, localUserId]
  );

  // Cleanup timer and peer on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      pcRef.current?.close();
    };
  }, []);

  return {
    callState,
    initiateCall,
    acceptCall,
    endCall,
    rejectCall,
    toggleAudio,
    toggleVideo,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    attachRemoteMedia,
    attachLocalPreview,
  };
}
