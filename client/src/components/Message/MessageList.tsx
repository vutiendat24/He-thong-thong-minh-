import React, { useRef, useEffect } from "react";

interface User {
  _id: string;
  email?: string;
  fullname?: string;
  avatar?: string;
}
interface Message {
  _id: string;
  conversationId: string;
  senderId: User | string;
  content?: string;
  createdAt?: string;
}

type Props = {
  messages: Message[];
  currentUserId: string | null;
  formatTimestamp: (ts?: string) => string;
};

export default function MessageList({ messages, currentUserId, formatTimestamp }: Props) {
  // messages ordered oldest-first (oldest at index 0), newest at the bottom
  return (
    <div className="space-y-5">
      {messages.map((message) => {
        const senderIsMe =
          (typeof message.senderId === "string" ? message.senderId : (message.senderId as User)._id) === currentUserId;
        const sender = typeof message.senderId === "string" ? undefined : (message.senderId as User);
        return (
          <div
            key={message._id}
            className={`flex items-end gap-3 ${senderIsMe ? "flex-row-reverse" : "flex-row"} animate-fade-in-up`}
          >
            {!senderIsMe && (
              <img
                src={sender?.avatar ?? `https://placehold.co/54x54/ccc/fff?text=${(sender?.fullname ?? "U").slice(0, 1)}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className={`max-w-[70%] lg:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-sm ${senderIsMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-slate-800 rounded-bl-none"}`}>
              {message.content && <p className="text-sm message-content">{message.content}</p>}
              <p className={`text-xs mt-1 text-right ${senderIsMe ? "text-indigo-200" : "text-slate-400"}`}>{formatTimestamp(message.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
