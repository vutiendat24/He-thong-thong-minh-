import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, MessageCircle, MoreVertical } from 'lucide-react';
import { useSocketContext } from '@/context/SocketContext';

const CallPage: React.FC = () => {
  const { callId } = useParams();
  const navigate = useNavigate();
  const {
    callState,
    initiateCall,
    endCall,
    toggleAudio,
    toggleVideo,
    socket,
    userID
  } = useSocketContext() ?? {};

  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [recipientName, setRecipientName] = useState<string>('');
  const [inputRecipientId, setInputRecipientId] = useState<string>('');
  const [inputRecipientName, setInputRecipientName] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  // Handle test response from server
  useEffect(() => {
    if (!socket) return;

    const handleTestResponse = (data: any) => {
      console.log('✅ Test response from server:', data);
      alert(`Socket test successful!\nServer response: ${data.message}`);
    };

    socket.on('test-response', handleTestResponse);

    return () => {
      socket.off('test-response', handleTestResponse);
    };
  }, [socket]);

  // Fetch available users for testing
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/messenger/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableUsers(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Initialize call when component mounts with callId from URL
  useEffect(() => {
    if (callId && userID && socket) {
      // Parse callId to get recipient info (format: recipientId-recipientName-callType)
      const parts = callId.split('-');
      if (parts.length >= 3) {
        const [recipient, name, type] = parts;
        setRecipientName(decodeURIComponent(name));
        setCallType(type as 'audio' | 'video');

        // Start the call
        initiateCall?.(recipient, type as 'audio' | 'video');
      }
    }
  }, [callId, userID, socket, initiateCall]);

  // Handle starting a call from the UI
  const handleStartCall = async () => {
    if (!inputRecipientId.trim() || !inputRecipientName.trim()) {
      alert('Vui lòng nhập ID và tên người nhận');
      return;
    }

    console.log('🎯 CallPage: Starting call with:', {
      recipientId: inputRecipientId,
      recipientName: inputRecipientName,
      callType,
      socketConnected: socket?.connected,
      userID,
      initiateCall: !!initiateCall
    });

    try {
      setRecipientName(inputRecipientName);

      if (!initiateCall) {
        throw new Error('initiateCall function not available');
      }

      if (!socket?.connected) {
        throw new Error('Socket not connected');
      }

      console.log('📞 CallPage: Calling initiateCall...');
      await initiateCall(inputRecipientId, callType);
      console.log('✅ CallPage: initiateCall completed successfully');

      // Navigate to call URL for better UX
      const callId = `${inputRecipientId}-${encodeURIComponent(inputRecipientName)}-${callType}`;
      navigate(`/call/${callId}`, { replace: true });
    } catch (error) {
      console.error('❌ CallPage: Failed to start call:', error);
      alert(`Không thể bắt đầu cuộc gọi: ${error instanceof Error ? error.message : String(error)}. Vui lòng thử lại.`);
    }
  };

  const handleEndCall = () => {
    if (callState?.remoteUserId) {
      endCall?.(callState.remoteUserId);
    }
    navigate('/messages');
  };

  const handleSendMessage = () => {
    navigate('/messages');
  };

  // Show call setup if no active call and no callId
  if ((!callState || callState.status === 'idle') && !callId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Phone className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bắt đầu cuộc gọi</h1>
            <p className="text-gray-600">Nhập thông tin người nhận để bắt đầu cuộc gọi</p>
          </div>

          <div className="space-y-4 mb-6">
            {/* User selection dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn người nhận
              </label>
              {loadingUsers ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500">
                  Đang tải danh sách người dùng...
                </div>
              ) : (
                <select
                  value={inputRecipientId}
                  onChange={(e) => {
                    const selectedUser = availableUsers.find(u => u._id === e.target.value);
                    setInputRecipientId(e.target.value);
                    setInputRecipientName(selectedUser?.fullname || '');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Chọn người dùng --</option>
                  {availableUsers.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.fullname} ({user.email}) {user.online ? '🟢' : '⚪'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Manual input (fallback) */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">Hoặc nhập thủ công:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ID người nhận
                  </label>
                  <input
                    type="text"
                    value={inputRecipientId}
                    onChange={(e) => setInputRecipientId(e.target.value)}
                    placeholder="ID người dùng"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tên người nhận
                  </label>
                  <input
                    type="text"
                    value={inputRecipientName}
                    onChange={(e) => setInputRecipientName(e.target.value)}
                    placeholder="Tên người dùng"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại cuộc gọi
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCallType('audio')}
                  className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                    callType === 'audio'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📞 Thoại
                </button>

                <button
                  onClick={() => setCallType('video')}
                  className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                    callType === 'video'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📹 Video
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleStartCall}
              disabled={!inputRecipientId.trim() || !inputRecipientName.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all"
            >
              Bắt đầu cuộc gọi
            </button>

            <button
              onClick={() => navigate('/messages')}
              className="w-full p-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Quay lại tin nhắn
            </button>
          </div>

          {/* Debug section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-medium text-gray-700 mb-2">🔧 Debug Info</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Socket Connected: <span className={socket?.connected ? 'text-green-600' : 'text-red-600'}>
                {socket?.connected ? '✅' : '❌'}
              </span></div>
              <div>Your UserID: <span className="font-mono">{userID || 'null'}</span></div>
              <div>Call State: <span className="font-mono">{callState?.status || 'idle'}</span></div>
              <div>initiateCall Available: <span className={initiateCall ? 'text-green-600' : 'text-red-600'}>
                {initiateCall ? '✅' : '❌'}
              </span></div>
              <div>Available Users: <span className={availableUsers.length > 0 ? 'text-green-600' : 'text-red-600'}>
                {availableUsers.length > 0 ? `${availableUsers.length} users` : '❌ No users loaded'}
              </span></div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  console.log('🔍 Debug Info:', {
                    socket: socket?.connected,
                    userID,
                    callState,
                    initiateCall: !!initiateCall,
                    socketId: socket?.id,
                    onlineUsers: 'Check server logs'
                  });
                  alert('Check console for debug info');
                }}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                Log Debug
              </button>

              <button
                onClick={() => {
                  if (socket?.connected) {
                    socket.emit('test-connection', { userId: userID, timestamp: Date.now() });
                    console.log('🧪 Test message sent to server');
                    alert('Test message sent - check server console');
                  } else {
                    alert('Socket not connected!');
                  }
                }}
                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
              >
                Test Socket
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show call interface based on call state
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />

      {/* Main call interface */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {recipientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-white font-semibold text-xl">{recipientName}</h1>
              <p className="text-gray-300 text-sm">
                {callState.status === 'calling' && 'Đang gọi...'}
                {callState.status === 'ringing' && 'Đang đổ chuông...'}
                {callState.status === 'connected' && `Đang gọi - ${Math.floor(callState.duration || 0 / 60)}:${String((callState.duration || 0) % 60).padStart(2, '0')}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSendMessage}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm"
            >
              <MessageCircle size={20} />
            </button>
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Call content area */}
        <div className="flex-1 flex items-center justify-center p-6">
          {callState.status === 'connected' && callType === 'video' ? (
            <div className="w-full max-w-4xl aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative">
              <video
                ref={(el) => {
                  if (el && callState) {
                    // This would be handled by the call manager
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local video overlay */}
              <div className="absolute top-4 right-4 w-48 h-32 bg-black/50 backdrop-blur-sm rounded-xl overflow-hidden border-2 border-white/20">
                <video
                  ref={(el) => {
                    if (el && callState) {
                      // This would be handled by the call manager
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!callState.isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <VideoOff className="text-white" size={24} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Audio call or connecting state
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl">
                <span className="text-6xl text-white font-bold">
                  {recipientName.charAt(0).toUpperCase()}
                </span>
              </div>

              <h2 className="text-white text-2xl font-semibold mb-2">{recipientName}</h2>

              {callState.status === 'calling' && (
                <div className="flex items-center justify-center gap-2 text-gray-300 mb-8">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>Đang kết nối...</span>
                </div>
              )}

              {callState.status === 'connected' && callType === 'audio' && (
                <div className="text-gray-300 mb-8">
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Đang gọi thoại</span>
                  </div>
                  <div className="text-2xl font-mono">
                    {Math.floor((callState.duration || 0) / 60)}:{String((callState.duration || 0) % 60).padStart(2, '0')}
                  </div>
                </div>
              )}

              {callState.status === 'ringing' && (
                <div className="text-gray-300 mb-8">
                  <div className="animate-pulse">Đang đổ chuông...</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="p-6 pb-8">
          <div className="flex items-center justify-center gap-6">
            {/* Audio toggle */}
            <button
              onClick={toggleAudio}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                callState.isMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              {callState.isMuted ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </button>

            {/* End call */}
            <button
              onClick={handleEndCall}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </button>

            {/* Video toggle (only for video calls) */}
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                  !callState.isVideoEnabled
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                {!callState.isVideoEnabled ? (
                  <VideoOff className="w-7 h-7 text-white" />
                ) : (
                  <Video className="w-7 h-7 text-white" />
                )}
              </button>
            )}
          </div>

          {/* Call type indicator */}
          <div className="text-center mt-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
              {callType === 'video' ? (
                <>
                  <Video size={16} />
                  Cuộc gọi video
                </>
              ) : (
                <>
                  <Phone size={16} />
                  Cuộc gọi thoại
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPage;
