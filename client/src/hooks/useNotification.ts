
import { useState, useCallback } from "react"

export type NotificationType = "success" | "error" | "info" | "warning"

interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const add = useCallback((message: string, type: NotificationType = "info", duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification = { id, message, type, duration }
    setNotifications((prev) => [...prev, notification])

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, duration)
    }

    return id
  }, [])

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { notifications, add, remove }
}
