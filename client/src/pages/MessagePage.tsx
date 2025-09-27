import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  ChevronLeft,
  Loader2,
  Smile,
  Paperclip,
} from "lucide-react";

// --- TypeScript Definitions ---
interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread?: number;
}

interface Message {
  id: string;
  text?: string;
  image?: string; // hỗ trợ ảnh
  sender: string;
  time: string;
}

// --- Mock Data ---
const contacts: Contact[] = [
  {
    id: "1",
    name: "Nguyễn Văn An",
    avatar: "https://placehold.co/100x100/667eea/E2E8F0?text=NA",
    lastMessage: "Chào bạn, hôm nay thế nào?",
    time: "10:30",
    unread: 2,
  },
  {
    id: "2",
    name: "Trần Thị Bình",
    avatar: "https://placehold.co/100x100/f5576c/E2E8F0?text=TB",
    lastMessage: "Cảm ơn bạn nhiều!",
    time: "09:15",
  },
  {
    id: "3",
    name: "Lê Minh Cường",
    avatar: "https://placehold.co/100x100/4facfe/E2E8F0?text=LC",
    lastMessage: "Hẹn gặp lại sau nhé",
    time: "08:45",
  },
  {
    id: "4",
    name: "Phạm Thu Dung",
    avatar: "https://placehold.co/100x100/a8edea/E2E8F0?text=PD",
    lastMessage: "Tài liệu đã gửi rồi",
    time: "Hôm qua",
    unread: 1,
  },
  {
    id: "5",
    name: "Hoàng Văn Em",
    avatar: "https://placehold.co/100x100/fed6e3/E2E8F0?text=HE",
    lastMessage: "OK, tôi hiểu rồi",
    time: "Hôm qua",
  },
];

const allMessages: Message[] = Array.from({ length: 20 }, (_, i) => ({
  id: `old-${20 - i}`,
  text: `Đây là tin nhắn cũ thứ ${20 - i}.`,
  sender: i % 2 === 0 ? "me" : "other",
  time: `08:${20 + i}`,
})).concat([
  { id: "1", text: "Chào bạn!", sender: "other", time: "10:25" },
  {
    id: "2",
    text: "Chào! Bạn khỏe không?",
    sender: "me",
    time: "10:26",
  },
  {
    id: "3",
    text: "Tôi khỏe, cảm ơn bạn. Hôm nay công việc thế nào?",
    sender: "other",
    time: "10:28",
  },
  {
    id: "4",
    text: "Khá bận rộn, nhưng mọi thứ đều ổn. Bạn có rảnh cuối tuần không?",
    sender: "me",
    time: "10:29",
  },
  {
    id: "5",
    text: "Có chứ! Chúng ta có thể gặp nhau để uống cà phê ☕",
    sender: "other",
    time: "10:30",
  },
]);

const initialMessages: Message[] = allMessages.slice(-7); // Hiển thị 7 tin nhắn cuối cùng

// --- Main Chat Component ---
export default function MessagePage() {
  const [selectedContact, setSelectedContact] = useState<Contact>(contacts[0]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showContactList, setShowContactList] = useState(true);
  const [oldestLoadedIndex, setOldestLoadedIndex] = useState(
    allMessages.length - 7
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(
    allMessages.length > 7
  );

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, selectedContact]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const messagesToLoad = 10;
    const newOldestIndex = Math.max(0, oldestLoadedIndex - messagesToLoad);
    const oldMessages = allMessages.slice(newOldestIndex, oldestLoadedIndex);

    setMessages((prevMessages) => [...oldMessages, ...prevMessages]);
    setOldestLoadedIndex(newOldestIndex);

    if (newOldestIndex === 0) {
      setHasMoreMessages(false);
    }

    // Khôi phục vị trí cuộn
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - previousScrollHeight;
      });
    }
    setIsLoadingMore(false);
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (
      event.currentTarget.scrollTop < 50 &&
      hasMoreMessages &&
      !isLoadingMore
    ) {
      loadMoreMessages();
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: "me",
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const message: Message = {
          id: Date.now().toString(),
          image: reader.result as string,
          sender: "me",
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, message]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMessages(initialMessages); // Reset messages cho contact mới
    setOldestLoadedIndex(allMessages.length - 7);
    setHasMoreMessages(allMessages.length > 7);
    if (window.innerWidth < 768) {
      setShowContactList(false);
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Render ---
  return (
    <div className="h-screen w-full flex bg-slate-100 font-sans">
      {/* Contact List Sidebar */}
      <aside
        className={`w-full md:w-[320px] lg:w-[360px] bg-white border-r border-slate-200 flex-col transition-transform duration-300 ease-in-out ${
          showContactList ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Chat</h1>
          <div className="relative">
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
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center gap-4 p-3 m-2 cursor-pointer rounded-lg transition-colors ${
                selectedContact.id === contact.id
                  ? "bg-indigo-500 text-white"
                  : "hover:bg-slate-100"
              }`}
              onClick={() => handleSelectContact(contact)}
            >
              <div className="relative">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full"
                />
                <span className="absolute bottom-0 right-0 block h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm truncate">
                    {contact.name}
                  </h3>
                  <span
                    className={`text-xs ${
                      selectedContact.id === contact.id
                        ? "text-indigo-200"
                        : "text-slate-400"
                    }`}
                  >
                    {contact.time}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p
                    className={`text-sm truncate ${
                      selectedContact.id === contact.id
                        ? "text-indigo-100"
                        : "text-slate-500"
                    }`}
                  >
                    {contact.lastMessage}
                  </p>
                  {contact.unread && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Window */}
      <main className={`flex-1 flex-col ${showContactList && "hidden md:flex"}`}>
        {/* Chat Header */}
        <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowContactList(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:text-indigo-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img
              src={selectedContact.avatar}
              alt={selectedContact.name}
              className="w-11 h-11 rounded-full"
            />
            <div>
              <h2 className="font-bold text-slate-800 text-lg">
                {selectedContact.name}
              </h2>
              <p className="text-sm text-green-500 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 bg-green-500 rounded-full inline-block"></span>
                Đang hoạt động
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Message Area */}
        <div
          className="flex-1 p-6 overflow-y-auto bg-slate-50"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          )}
          {!hasMoreMessages && (
            <p className="text-center text-sm text-slate-400 py-4">
              Đã hiển thị tất cả tin nhắn
            </p>
          )}
          <div className="space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${
                  message.sender === "me" ? "flex-row-reverse" : "flex-row"
                } animate-fade-in-up`}
              >
                {message.sender === "other" && (
                  <img
                    src={selectedContact.avatar}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div
                  className={`max-w-[70%] lg:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-sm ${
                    message.sender === "me"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 rounded-bl-none"
                  }`}
                >
                  {message.text && <p className="text-sm">{message.text}</p>}
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Ảnh gửi"
                      className="rounded-lg max-w-full h-auto mt-2"
                    />
                  )}
                  <p
                    className={`text-xs mt-1 text-right ${
                      message.sender === "me"
                        ? "text-indigo-200"
                        : "text-slate-400"
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <footer className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 w-full px-4 py-2 bg-slate-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSendMessage}
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={!newMessage.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

// Thêm CSS cho animation
const style = document.createElement("style");
style.innerHTML = `
@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out forwards;
}
`;
document.head.appendChild(style);
