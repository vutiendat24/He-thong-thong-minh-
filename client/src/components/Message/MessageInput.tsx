import React from "react";
import { Smile, Send } from "lucide-react";

type Props = {
  newMessage: string;
  setNewMessage: (v: string) => void;
  onSend: () => void;
  showEmojiPicker: boolean;
  toggleEmojiPicker: () => void;
  emojis: string[];
  addEmoji: (e: string) => void;
};

export default function MessageInput({ newMessage, setNewMessage, onSend, showEmojiPicker, toggleEmojiPicker, emojis, addEmoji }: Props) {
  return (
    <footer className="p-4 border-t border-slate-200 bg-white">
      <div className="flex items-center gap-2 relative">
        <div className="relative">
          <button onClick={toggleEmojiPicker} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          {showEmojiPicker && (
            <div className="  absolute bottom-12 left-0 bg-white border rounded-md shadow-md p-2 
  grid grid-cols-4 gap-2 z-20
  min-w-[180px]">
              {emojis.map((e) => (
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
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          className="flex-1 w-full px-4 py-2 bg-slate-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={onSend} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50" disabled={!newMessage.trim()}>
          <Send className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
}
