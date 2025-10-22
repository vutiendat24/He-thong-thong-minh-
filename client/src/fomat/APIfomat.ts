
export interface ApiResponse<T = any> {
  status: "true" | "false"
  message: string
  code?: string
  data?: T | null
}
