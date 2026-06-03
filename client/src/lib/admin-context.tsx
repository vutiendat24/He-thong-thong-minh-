
import { createContext, useContext, useState, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import { mockUsers } from "./mock-data"

interface AdminContextType {
  currentUser: User
  setCurrentUser: (user: User) => void
  hasPermission: (requiredRoles: UserRole[]) => boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  // Default to superadmin for demo purposes
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[5])
  
  const hasPermission = (requiredRoles: UserRole[]) => {
    return requiredRoles.includes(currentUser.role)
  }

  return (
    <AdminContext.Provider value={{ currentUser, setCurrentUser, hasPermission }}>{children}</AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
