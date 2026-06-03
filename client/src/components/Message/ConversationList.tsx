import React from "react";

interface User {
  _id: string;
  email?: string;
  fullname?: string;
  avatar?: string;
  online?: boolean;
}
interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: string;
  updatedAt?: string;
}

type Props = {
  conversations: Conversation[];
  currentUserId: string | null;
  searchQuery: string;
  onSelect: (conv: Conversation) => void;
  selectedConvId?: string | null;
  formatTimestamp: (ts?: string) => string;
};

export default function ConversationList({
  conversations,
  currentUserId,
  searchQuery,
  onSelect,
  selectedConvId,
  formatTimestamp,
}: Props) {
  const getOther = (conv: Conversation) => conv.participants.find((p) => p._id !== currentUserId) ?? conv.participants[0];

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations
        .filter((c) => {
          const other = getOther(c);
          return (
            other?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            other?.email?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
        .map((conv) => {
          const other = getOther(conv);
          const isSelected = selectedConvId === conv._id;
          return (
            <div
              key={conv._id}
              onClick={() => onSelect(conv)}
              className={`flex items-center gap-4 p-3 m-2 cursor-pointer rounded-lg transition-colors ${isSelected ? "bg-indigo-500 text-white" : "hover:bg-slate-100"}`}
            >
              <div className="relative">
                <img
                  src={other?.avatar ?? `https://placehold.co/100x100/ccc/fff?text=${(other?.fullname ?? other?.email ?? "U").slice(0, 1)}`}
                  alt={other?.fullname ?? other?.email}
                  className="w-12 h-12 rounded-full"
                />
                <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white ${other?.online ? "bg-green-500" : "bg-gray-300"}`}></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm truncate">{other?.fullname ?? other?.email}</h3>
                  <span className={`text-xs ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>{formatTimestamp(conv.updatedAt)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className={`text-sm truncate ${isSelected ? "text-indigo-100" : "text-slate-500"}`}>{conv.lastMessage ?? ""}</p>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
