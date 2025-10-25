import React from "react";
import { io as ioClient, Socket } from "socket.io-client";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  ChevronLeft,
  Loader2,
  Smile,
} from "lucide-react";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const socketRef = useRef<Socket | null>(null);

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

  // --- Kết nối Socket.IO: join phòng user và lắng nghe sự kiện realtime ---
  useEffect(() => {
    const token = getToken();
    if (!token || !currentUserId) return;

    const socket = ioClient("http://localhost:3000", { query: { currentUserId },auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      // tham gia phòng theo userId (server sẽ xử lý)
      socket.emit("join", currentUserId);
    });

    // Nếu server trả về tokenExpired -> logout phía client và điều hướng về trang đăng nhập
    socket.on("tokenExpired", () => {
      try {
        localStorage.removeItem("token"); 
        delete axios.defaults.headers.common["Authorization"];
      } catch {}
      try { navigate("/"); } catch {}
    });

    // Hàm cập nhật trạng thái online/offline cho bạn bè
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

    socket.on("friendOnline", (payload: { userId: string }) => {
      if (!payload?.userId) return;
      applyPresence(payload.userId, true);
    });
    socket.on("friendOffline", (payload: { userId: string }) => {
      if (!payload?.userId) return;
      applyPresence(payload.userId, false);
    });

    // Nhận tin nhắn realtime
    socket.on("receiveMessage", (message: Message) => {
      // xử lý optimistic / append
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(message._id))) return prev;
        const optIndex = prev.findIndex((m) =>
          /^[0-9]+$/.test(String(m._id)) &&
          String(m.conversationId) === String(message.conversationId) &&
          m.content === message.content
        );
        if (optIndex !== -1) {
          const next = [...prev];
          next[optIndex] = message;
          return next;
        }
        return [...prev, message];
      });
      setConversations((prev) =>
        prev.map((c) =>
          c._id === String(message.conversationId)
            ? { ...c, lastMessage: message.content ?? "", updatedAt: message.createdAt ?? new Date().toISOString() }
            : c
        )
      );
    });

    socket.on("newConversation", (conv: Conversation) => {
      setConversations((prev) => [conv, ...prev]);
    });

    socket.on("connect_error", (err) => console.warn("Socket connect_error:", err));

    return () => {
      socket.off("friendOnline");
      socket.off("friendOffline");
      socket.off("tokenExpired");
      // không còn handler signaling
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

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
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, selectedConv]);

  // Chèn CSS animation một lần
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
.animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
`;
    document.head.appendChild(style);
    return () => {
      try {
        document.head.removeChild(style);
      } catch {}
    };
  }, []);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    if (window.innerWidth < 768) {
      // ẩn thanh trái trên mobile nếu cần
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConv) return;
    if (!newMessage.trim()) return;

    try {
      // Ưu tiên gửi qua socket nếu có kết nối; server vẫn lưu và emit lại
      const socket = socketRef.current;
      const other = selectedConv.participants.find((p) => p._id !== currentUserId);
      const receiverId = other?._id;
      if (socket && socket.connected) {
        socket.emit("sendMessage", { receiverId, content: newMessage.trim(), conversationId: selectedConv._id });
        // optimistic UI
        const optimistic: Message = {
          _id: Date.now().toString(),
          conversationId: selectedConv._id,
          senderId: currentUserId ?? "me",
          content: newMessage.trim(),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setConversations((prevConvs) =>
          prevConvs.map((c) =>
            c._id === selectedConv._id ? { ...c, lastMessage: optimistic.content, updatedAt: optimistic.createdAt } : c
          )
        );
        setNewMessage("");
      } else {
        // fallback HTTP (server vẫn lưu và emit)
        const res = await axios.post(`${API_BASE}/message`, { conversationId: selectedConv._id, content: newMessage.trim() });
        const created: Message | undefined = res.data?.data;
        if (created) {
          setMessages((prev) => [...prev, created]);
          setConversations((prevConvs) =>
            prevConvs.map((c) =>
              c._id === selectedConv._id ? { ...c, lastMessage: created.content, updatedAt: created.createdAt } : c
            )
          );
        }
        setNewMessage("");
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    }
   };

  // Danh sách emoji mẫu
  const EMOJIS = ["😊", "😂", "😍", "👍", "🎉", "😢", "🔥", "❤️"];
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
            className="absolute top-4 left-4 flex items-center justify-center w-9 h-9 rounded-lg text-blue-800"
          >
            {/* gán color tĩnh để chắc chắn hiển thị */}
            <ChevronLeft className="w-5 h-5 text-blue-500"  />
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

        <div className="flex-1 overflow-y-auto">
          {conversations
            .filter((c) => {
              const other = getOtherParticipant(c);
              return (
                other?.fullname
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                other?.email?.toLowerCase().includes(searchQuery.toLowerCase())
              );
            })
            .map((conv) => {
              const other = getOtherParticipant(conv);
              const isSelected = selectedConv?._id === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-4 p-3 m-2 cursor-pointer rounded-lg transition-colors ${
                    isSelected ? "bg-indigo-500 text-white" : "hover:bg-slate-100"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={
                        other?.avatar ??
                        `https://placehold.co/100x100/ccc/fff?text=${(
                          other?.fullname ?? other?.email ?? "U"
                        ).slice(0, 1)}`
                      }
                      alt={other?.fullname ?? other?.email}
                      className="w-12 h-12 rounded-full"
                    />
                    <span
                      className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white ${other?.online ? "bg-green-500" : "bg-gray-300"}`}
                    ></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm truncate">
                        {other?.fullname ?? other?.email}
                      </h3>
                      <span
                        className={`text-xs ${
                          isSelected ? "text-indigo-200" : "text-slate-400"
                        }`}
                      >
                        {formatTimestamp(conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p
                        className={`text-sm truncate ${
                          isSelected ? "text-indigo-100" : "text-slate-500"
                        }`}
                      >
                        {conv.lastMessage ?? ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
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
            <button className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors" title="Gọi thoại">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors" title="Gọi video">
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
            {messages.map((message) => {
              const senderIsMe =
                (typeof message.senderId === "string"
                  ? message.senderId
                  : (message.senderId as User)._id) === currentUserId;
              const sender =
                typeof message.senderId === "string"
                  ? undefined
                  : (message.senderId as User);
              return (
                <div
                  key={message._id}
                  className={`flex items-end gap-3 ${
                    senderIsMe ? "flex-row-reverse" : "flex-row"
                  } animate-fade-in-up`}
                >
                  {!senderIsMe && (
                    <img
                      src={
                        sender?.avatar ?? `https://placehold.co/54x54/ccc/fff?text=${(
                          sender?.fullname ?? "U"
                        ).slice(0, 1)}`
                      }
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div
                    className={`max-w-[70%] lg:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      senderIsMe
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-white text-slate-800 rounded-bl-none"
                    }`}
                  >
                    {message.content && <p className="text-sm">{message.content}</p>}
                    <p
                      className={`text-xs mt-1 text-right ${
                        senderIsMe ? "text-indigo-200" : "text-slate-400"
                      }`}
                    >
                      {formatTimestamp(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2 relative">
            {/* Nút emoji + popover emoji */}
            <div className="relative">
              <button
                onClick={toggleEmojiPicker}
                className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 bg-white border rounded-md shadow-md p-2 grid grid-cols-4 gap-2 z-20">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => addEmoji(e)} className="p-1 text-lg">
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 w-full px-4 py-2 bg-slate-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSendMessage}
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={!newMessage.trim()}
            >
              {/* gán màu trắng cho icon gửi */}
              <Send className="w-5 h-5" color="#ffffff" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
