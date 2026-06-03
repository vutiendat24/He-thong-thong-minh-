import { useEffect, useState } from 'react';
import { useSocketContext } from '@/context/SocketContext';
import { Mic, MicOff, Video, VideoOff, Phone, Maximize2, Minimize2 } from 'lucide-react';

export default function CallWindow() {
  const context = useSocketContext();
  const { callState, localVideoRef, remoteVideoRef, remoteAudioRef, toggleAudio, toggleVideo, endCall } = context ?? {};
  const [duration, setDuration] = useState(0);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');

  useEffect(() => {
    if (callState?.status !== 'connected') return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [callState?.status]);

  useEffect(() => {
    if (callState?.status === 'calling' || callState?.status === 'connected') {
      setDuration(0);
    }
  }, [callState?.status]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':').replace(/^00:/, '');
  };

  if (!callState || (callState.status !== 'connected' && callState.status !== 'calling')) return null;

  const isVideoCall = callState.callType === 'video';
  const isConnecting = callState.status === 'calling';
  const remoteUserName = callState.remoteUserName || `Người dùng ${callState.remoteUserId?.slice(0, 8)}`;
  const remoteUserAvatar = callState.remoteUserAvatar;

  const handleEndCall = () => {
    if (endCall && callState.remoteUserId) {
      endCall(callState.remoteUserId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-300 call-window">
      {/* Remote Video / Avatar Background */}
      {isVideoCall ? (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'} bg-black video-fade-in ${callState.status === 'connected' ? '' : 'opacity-0'} ${callState?.isRemoteVideoEnabled === false ? 'opacity-0' : ''}`}
          />
          {callState.status !== 'connected' && (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <div className="relative z-10">
                {remoteUserAvatar ? (
                  <img
                    src={remoteUserAvatar}
                    alt={remoteUserName}
                    className="w-40 h-40 rounded-full object-cover border-4 border-white/30 shadow-2xl"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 text-6xl font-bold text-white shadow-2xl">
                    {remoteUserName?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* subtle overlay when connected */}
          {callState.status === 'connected' && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
          )}
          {/* overlay when remote camera is off */}
          {callState.status === 'connected' && callState?.isRemoteVideoEnabled === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <VideoOff className="w-10 h-10 text-white" />
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="relative z-10">
            {remoteUserAvatar ? (
              <img
                src={remoteUserAvatar}
                alt={remoteUserName}
                className="w-40 h-40 rounded-full object-cover border-4 border-white/30 shadow-2xl"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 text-6xl font-bold text-white shadow-2xl">
                {remoteUserName?.charAt(0) || '?'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <span className="text-white font-bold">{remoteUserName?.charAt(0) || '?'}</span>
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{remoteUserName}</h2>
            <p className="text-gray-300 text-sm">
              {isConnecting ? 'Đang kết nối...' : 'Đang gọi'}
            </p>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-white text-sm font-mono">
            {isConnecting ? '00:00' : formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Connection Spinner */}
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-transparent border-t-blue-400 rounded-full animate-spin animation-delay-150" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg mb-2">Đang kết nối...</p>
              <p className="text-gray-300 text-sm">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        </div>
      )}

      {/* Local Video - Picture in Picture (only for caller) */}
      {isVideoCall && callState?.isCaller && (
        <div className="absolute bottom-32 right-6 w-40 h-28 bg-black/50 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl pip-video call-connect">
          {callState?.isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <VideoOff className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent control-bar control-slide-up">
        <div className="flex justify-center items-center gap-6">
          {/* Audio toggle */}
          <button
            onClick={() => toggleAudio?.()}
            className={`w-16 h-16 rounded-full flex items-center justify-center call-button shadow-lg ${
              callState?.isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }`}
          >
            {callState?.isMuted ? (
              <MicOff className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>

          {/* End call */}
          <button
            onClick={handleEndCall}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center call-button shadow-lg shadow-red-500/25"
          >
            <Phone className="w-8 h-8 text-white rotate-[135deg]" />
          </button>

          {/* Video toggle */}
          {isVideoCall && (
            <button
              onClick={() => toggleVideo?.()}
              className={`w-16 h-16 rounded-full flex items-center justify-center call-button shadow-lg ${
                callState?.isVideoEnabled
                  ? 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {callState?.isVideoEnabled ? (
                <Video className="w-7 h-7 text-white" />
              ) : (
                <VideoOff className="w-7 h-7 text-white" />
              )}
            </button>
          )}

          {/* View fit toggle */}
          <button
            onClick={() => setFitMode((m) => (m === 'contain' ? 'cover' : 'contain'))}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm call-button shadow-lg"
            title={fitMode === 'contain' ? 'Phóng to toàn màn hình' : 'Thu gọn vừa khung'}
          >
            {fitMode === 'contain' ? (
              <Maximize2 className="w-6 h-6 text-white" />
            ) : (
              <Minimize2 className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Call quality indicator */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-sm">
              {isVideoCall ? 'Video HD' : 'Âm thanh HD'}
            </span>
          </div>
        </div>
      </div>

      {/* Remote audio element (for both audio and video calls) */}
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
