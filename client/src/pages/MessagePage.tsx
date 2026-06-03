import React from "react";
// dùng socket dùng chung từ SocketContext
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Phone, Video, MoreVertical, ChevronLeft, Loader2 } from "lucide-react";
import ConversationList from "../components/Message/ConversationList";
import MessageList from "../components/Message/MessageList";
import MessageInput from "../components/Message/MessageInput";
import { useSocketContext } from "@/context/SocketContext";

// --- Định nghĩa kiểu dữ liệu (Tiếng Việt) ---
interface User {
  _id: string;
  email?: string;
  fullname?: string;
  avatar?: string;
  online?: boolean;
}

interface Conversation {
  _id: string;
  participants: User[]; // server trả về participant đã populate
  lastMessage?: string;
  lastSender?: string;
  updatedAt?: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: User | string;
  content?: string;
  createdAt?: string;
  image?: string;
}

// --- Component chính của chat ---
export default function MessagePage() {
  const API_BASE = "http://localhost:3000/melody/messenger"; // khớp route server
  const navigate = useNavigate();

  // trạng thái ứng dụng
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const selectedConvRef = useRef<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { socket, initiateCall } = useSocketContext() ?? {};

  // Lấy token từ localStorage và decode userId từ payload JWT
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const getToken = () => localStorage.getItem("token");
  const decodeUserIdFromToken = (token?: string) => {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(payload)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const obj = JSON.parse(json);
      // tìm trường id phổ biến7
      return obj?.id ?? obj?._id ?? obj?.userId ?? obj?.userID ?? null;
    } catch {
      return null;
    }
  };

  // Gắn header Authorization cho axios nếu token tồn tại
  // và lắng nghe sự thay đổi token trong localStorage
  useEffect(() => {
    const applyToken = () => {
      const token = getToken();
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const uid = decodeUserIdFromToken(token);
        console.log("uid", uid)
        setCurrentUserId(uid);
      } else {
        delete axios.defaults.headers.common["Authorization"];
        setCurrentUserId(null);
      }
    };

    applyToken();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") applyToken();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // --- Lắng nghe realtime bằng socket dùng chung ---
  useEffect(() => {
    if (!socket || !currentUserId) return;

    // tham gia phòng theo userId (nếu cần)
    socket.emit("join", currentUserId);

    const applyPresence = (userId: string, online: boolean) => {
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          participants: conv.participants.map((p) =>
            String(p._id) === String(userId) ? { ...p, online } : p
          ),
        }))
      );
      setSelectedConv((prev) => {
        if (!prev) return prev;
        const changed = prev.participants.some((p) => String(p._id) === String(userId));
        if (!changed) return prev;
        return {
          ...prev,
          participants: prev.participants.map((p) =>
            String(p._id) === String(userId) ? { ...p, online } : p
          ),
        };
      });
    };

    const onFriendOnline = (payload: { userId: string }) => {
      if (!payload?.userId) return;
      applyPresence(payload.userId, true);
    };
    const onFriendOffline = (payload: { userId: string }) => {
      if (!payload?.userId) return;
      applyPresence(payload.userId, false);
    };

    const onReceiveMessage = (message: Message) => {
      const openConvId = selectedConvRef.current?._id ?? null;
      if (String(openConvId) === String(message.conversationId)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(message._id))) return prev;
          const optIndex = prev.findIndex((m) =>
            /^[0-9]+$/.test(String(m._id)) &&
            String(m.conversationId) === String(message.conversationId) &&
            m.content === message.content
          );
          const next = [...prev];
          if (optIndex !== -1) {
            next[optIndex] = message;
          } else {
            next.push(message);
          }
          return next;
        });
      }

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === String(message.conversationId)
            ? { ...c, lastMessage: message.content ?? "", updatedAt: message.createdAt ?? new Date().toISOString() }
            : c
        );
        const idx = updated.findIndex((c) => c._id === String(message.conversationId));
        if (idx === -1) return updated;
        const conv = updated[idx];
        const rest = updated.filter((_, i) => i !== idx);
        return [conv, ...rest];
      });
    };

    socket.on("friendOnline", onFriendOnline);
    socket.on("friendOffline", onFriendOffline);
    socket.on("receiveMessage", onReceiveMessage);

    return () => {
      socket.off("friendOnline", onFriendOnline);
      socket.off("friendOffline", onFriendOffline);
      socket.off("receiveMessage", onReceiveMessage);
    };
  }, [socket, currentUserId]);

  // Tải danh sách hội thoại cho user hiện tại
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // gọi endpoint, server lấy userId từ token
        const res = await axios.get(`${API_BASE}/conversations`);
        const convs: Conversation[] = res.data?.data ?? [];
        setConversations(convs);
        if (convs.length > 0 && !selectedConv) {
          setSelectedConv(convs[0]);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setConversations([]);
      }
    };
    fetchConversations();
  }, []); // chạy một lần

  // Khi chọn cuộc hội thoại → tải tin nhắn từ server
  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const res = await axios.get(
          `${API_BASE}/messages/${selectedConv._id}`
        );
        // server trả về mảng messages
        const msgs: Message[] = res.data ?? [];
        // sắp xếp oldest-first (thứ tự hiển thị: cũ -> mới) để tin nhắn cuối nằm dưới cùng
        msgs.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        });
        setMessages(msgs);
      } catch (err) {
        console.error("Lỗi khi tải tin nhắn:", err);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedConv]);

  // Tự cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messagesContainerRef.current) {
      // messages ordered oldest-first, cuộn xuống cuối (bottom) để thấy tin nhắn mới nhất
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, selectedConv]);

  // Chèn CSS animation một lần
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
.message-content { word-break: break-word; white-space: pre-wrap; font-family: 'Noto Color Emoji', 'Segoe UI Emoji', 'Apple Color Emoji', 'Segoe UI Symbol', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
`;
    document.head.appendChild(style);
    return () => {
      try {
        document.head.removeChild(style);
      } catch { }
    };
  }, []);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    if (window.innerWidth < 768) {
      // ẩn thanh trái trên mobile nếu cần
    }
  };

  // keep ref updated so socket handlers can see latest selected conversation
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  const handleInitiateCall = async (callType: "audio" | "video") => {
  console.log("handleInitiateCall:", {
    callType,
    conv: selectedConv?._id,
    currentUserId,
  });

  if (!selectedConv || !initiateCall) {
    console.warn("❌ Cannot initiate call");
    return;
  }

  // Lấy user còn lại trong cuộc chat
  const other = selectedConv.participants.find(
    (p) => p._id !== currentUserId
  );

  if (!other) {
    console.warn("❌ No other user in conversation");
    return;
  }

  console.log("📞 Gọi tới:", other._id);

  try {
    await initiateCall(String(other._id), callType);
    console.log("✅ Call initiated");
  } catch (err) {
    console.error("❌ Lỗi gọi:", err);
  }
};


  const handleSendMessage = async () => {
    if (!selectedConv) return;
    if (!newMessage.trim()) return;

    try {
      // Ưu tiên gửi qua socket nếu có kết nối; server vẫn lưu và emit lại
      const socketInst = socket;
      const other = selectedConv.participants.find((p) => p._id !== currentUserId);
      const receiverId = other?._id;
      if (socketInst && socketInst.connected) {
        socketInst.emit("sendMessage", { receiverId, content: newMessage.trim(), conversationId: selectedConv._id });
        // optimistic UI
        const optimistic: Message = {
          _id: Date.now().toString(),
          conversationId: selectedConv._id,
          senderId: currentUserId ?? "me",
          content: newMessage.trim(),
          createdAt: new Date().toISOString(),
        };
        // chèn optimistic (append to end) so newest is at bottom
        setMessages((prev) => [...prev, optimistic]);
        setConversations((prevConvs) => {
          const updated = prevConvs.map((c) =>
            c._id === selectedConv._id ? { ...c, lastMessage: optimistic.content, updatedAt: optimistic.createdAt } : c
          );
          // đưa conversation này lên đầu
          const idx = updated.findIndex((c) => c._id === selectedConv._id);
          if (idx === -1) return updated;
          const conv = updated[idx];
          const rest = updated.filter((_, i) => i !== idx);
          return [conv, ...rest];
        });
        setNewMessage("");
      } else {
        // fallback HTTP (server vẫn lưu và emit)
        const res = await axios.post(`${API_BASE}/message`, { conversationId: selectedConv._id, content: newMessage.trim() });
        const created: Message | undefined = res.data?.data;
        if (created) {
          setMessages((prev) => [...prev, created]);
          setConversations((prevConvs) => {
            const updated = prevConvs.map((c) =>
              c._id === selectedConv._id ? { ...c, lastMessage: created.content, updatedAt: created.createdAt } : c
            );
            const idx = updated.findIndex((c) => c._id === selectedConv._id);
            if (idx === -1) return updated;
            const conv = updated[idx];
            const rest = updated.filter((_, i) => i !== idx);
            return [conv, ...rest];
          });
        }
        setNewMessage("");
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    }
  };

  // Danh sách emoji mẫu
  const EMOJIS = ["🙂", "😀", "😍", "👍", "🎉", "😢", "🔥", "❤️", "🤥","🤧", "👿"];
  const toggleEmojiPicker = () => setShowEmojiPicker((s) => !s);
  const addEmoji = (e: string) => {
    setNewMessage((prev) => prev + e);
    setShowEmojiPicker(false);
  };

  // Lấy participant khác trong conversation
  const getOtherParticipant = (conv: Conversation) => {
    return (
      conv.participants.find((p) => p._id !== currentUserId) ??
      conv.participants[0]
    );
  };

  // Hàm format thời gian hiển thị
  const formatTimestamp = (ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (d >= startOfToday) {
      // hôm nay -> chỉ giờ
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (d >= startOfYesterday && d < startOfToday) {
      // hôm qua
      return "Hôm qua";
    }
    // xa hơn -> ngày mặc định
    return d.toLocaleDateString("vi-VN");
  };

  // --------------------------------------------------------

  // --- Render ---
  return (
    <div className="h-screen w-full flex bg-slate-100 font-sans">
      {/* Thanh bên danh sách cuộc hội thoại */}
      <aside
        className={`w-full md:w-[320px] lg:w-[360px] bg-white border-r border-slate-200 flex-col transition-transform duration-300 ease-in-out flex`}
      >
        <div className="p-4 border-b border-slate-200 relative">
          {/* Nút quay lại (hiển thị rõ) */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 
                 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 
                 active:scale-95 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 stroke-blue-600" strokeWidth={2} />
            
          </button>
          <h1 className="text-2xl font-bold text-slate-800 text-center">Chat</h1>
          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
          searchQuery={searchQuery}
          onSelect={handleSelectConversation}
          selectedConvId={selectedConv?._id}
          formatTimestamp={formatTimestamp}
        />
      </aside>

      {/* Cửa sổ chat chính */}
      <main className="flex-1 flex-col md:flex">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                /* tùy chọn cho mobile */
              }}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:text-indigo-600"
            >
              {/* icon quay lại cho mobile */}
              <ChevronLeft className="w-6 h-6" color="#0f172a" />
            </button>
            <img
              src={
                selectedConv
                  ? getOtherParticipant(selectedConv).avatar ?? `https://placehold.co/100x100/ccc/fff?text=${(
                    getOtherParticipant(selectedConv).fullname ?? "U"
                  ).slice(0, 1)}`
                  : `https://placehold.co/100x100/ccc/fff?text=?`
              }
              alt={selectedConv ? getOtherParticipant(selectedConv).fullname : "Chat"}
              className="w-11 h-11 rounded-full"
            />
            <div>
              <h2 className="font-bold text-slate-800 text-lg">
                {selectedConv
                  ? getOtherParticipant(selectedConv).fullname ??
                  getOtherParticipant(selectedConv).email
                  : "Chọn cuộc hội thoại"}
              </h2>
              <p className={`text-sm font-medium flex items-center gap-1.5 ${selectedConv && getOtherParticipant(selectedConv)?.online ? 'text-green-500' : 'text-slate-400'}`}>
                <span className={`h-2 w-2 rounded-full inline-block ${selectedConv && getOtherParticipant(selectedConv)?.online ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                {selectedConv && getOtherParticipant(selectedConv)?.online ? 'Đang hoạt động' : 'Ngoại tuyến'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleInitiateCall("audio")} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors" title="Gọi thoại">
              <Phone className="w-5 h-5" />
            </button>
            <button onClick={() => handleInitiateCall("video")} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors" title="Gọi video">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div
          className="flex-1 p-6 overflow-y-auto bg-slate-50"
          ref={messagesContainerRef}
        >
          {isLoadingMessages && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          )}
          <div className="space-y-5">
            <MessageList messages={messages} currentUserId={currentUserId} formatTimestamp={formatTimestamp} />
          </div>
        </div>

        <MessageInput newMessage={newMessage} setNewMessage={setNewMessage} onSend={handleSendMessage} showEmojiPicker={showEmojiPicker} toggleEmojiPicker={toggleEmojiPicker} emojis={EMOJIS} addEmoji={addEmoji} />
      </main>
    </div>
  );
}
