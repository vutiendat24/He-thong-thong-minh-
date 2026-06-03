export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 30
}

export const validateBanDays = (days: number): boolean => {
  return days >= 1 && days <= 365
}

export const getReasonLabel = (reason: string): string => {
  return reason.replace(/_/g, " ").toLowerCase()
}

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: "Active",
    warning: "Warning",
    temp_banned: "Temporarily Banned",
    banned: "Permanently Banned",
    pending: "Pending",
    reviewing: "Reviewing",
    resolved: "Resolved",
    rejected: "Rejected",
  }
  return labels[status] || status
}
