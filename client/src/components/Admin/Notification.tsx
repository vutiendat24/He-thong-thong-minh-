 

import { X } from "lucide-react"
import type { NotificationType } from "../../hooks/useNotification"

interface NotificationProps {
  id: string
  message: string
  type: NotificationType
  onClose: (id: string) => void
}

export default function Notification({ id, message, type, onClose }: NotificationProps) {
  const baseClass = "fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white flex items-center gap-3 max-w-sm shadow-lg"

  const typeClass = {
    success: "bg-[#10b981]",
    error: "bg-[#ef4444]",
    warning: "bg-[#f59e0b]",
    info: "bg-[#3b82f6]",
  }

  return (
    <div className={`${baseClass} ${typeClass[type]}`}>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={() => onClose(id)} className="p-1 hover:opacity-80 transition-opacity">
        <X size={16} />
      </button>
    </div>
  )
}
