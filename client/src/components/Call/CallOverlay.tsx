import { useEffect, useState } from 'react';
import { useSocketContext } from '@/context/SocketContext';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCall {
  from: string;
  fromName?: string;
  fromAvatar?: string;
  callType: 'audio' | 'video';
  offer?: any;
}

export default function CallOverlay() {
  const { callState, acceptCall, rejectCall, socket } = useSocketContext() ?? {};
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);

  // Sync incoming call from callState
  useEffect(() => {
    if (callState?.status === 'ringing') {
      console.log('📞 CallOverlay: Incoming call detected', {
        from: callState.remoteUserId,
        type: callState.callType,
        name: callState.remoteUserName,
      });
      setIncoming({
        from: callState.remoteUserId || '',
        fromName: callState.remoteUserName,
        fromAvatar: callState.remoteUserAvatar,
        callType: callState.callType || 'audio',
        offer: callState.offer,
      });
    } else {
      setIncoming(null);
    }
  }, [callState?.status, callState?.remoteUserId, callState?.remoteUserName, callState?.remoteUserAvatar, callState?.callType]);

  // Send acknowledgement to caller that we received the call notification
  useEffect(() => {
    if (socket && incoming && callState?.status === 'ringing') {
      console.log('✅ CallOverlay: Sending call:ack to caller', incoming.from);
      socket.emit('call:ack', { to: incoming.from });
    }
  }, [socket, incoming, callState?.status]);

  const handleAccept = async () => {
    if (!incoming || !acceptCall) return;
    try {
      console.log('✅ CallOverlay: User accepting call from', incoming.from);
      await acceptCall(incoming.from, incoming.callType, incoming.offer);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleReject = () => {
    if (!incoming || !rejectCall) return;
    console.log('❌ CallOverlay: User rejecting call from', incoming.from);
    rejectCall(incoming.from);
  };

  if (!incoming) return null;

  const isVideoCall = incoming.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center pointer-events-none call-overlay">
      <div className="pointer-events-auto bg-white rounded-3xl shadow-2xl overflow-hidden w-96 max-w-[90vw]">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-12 translate-y-12" />
          </div>

          <div className="relative w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 overflow-hidden border-4 border-white/30 shadow-xl">
            {incoming.fromAvatar ? (
              <img src={incoming.fromAvatar} alt={incoming.fromName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl font-bold text-white drop-shadow-lg">{incoming.fromName?.charAt(0) || '?'}</span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-center mb-2 drop-shadow-sm">{incoming.fromName}</h2>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            {isVideoCall ? (
              <>
                <Video className="w-5 h-5" />
                <span className="text-sm font-medium">Cuộc gọi video</span>
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                <span className="text-sm font-medium">Cuộc gọi thoại</span>
              </>
            )}
          </div>

          
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50">
          <div className="flex gap-4">
            <button
              onClick={handleReject}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg"
            >
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 rotate-[135deg]" />
              </div>
              Từ chối
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg"
            >
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              Chấp nhận
            </button>
          </div>

          {/* Reminder text */}
          <p className="text-center text-gray-500 text-sm mt-4">
            Cuộc gọi sẽ bắt đầu ngay sau khi bạn chấp nhận
          </p>
        </div>
      </div>
    </div>
  );
}
