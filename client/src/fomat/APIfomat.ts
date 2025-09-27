
export interface ApiResponse<T = any> {
  status: "success" | "error"
  message: string
  code?: string
  data: T | null
}
