export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const formatDateTime = (date: Date | string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num)
}

export const truncateId = (id: string, length = 12): string => {
  return id.length > length ? `${id.slice(0, length)}...` : id
}
