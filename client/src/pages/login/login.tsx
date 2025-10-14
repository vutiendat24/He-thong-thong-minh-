
import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import axios from "axios";

type FormData = {
  email: string
  password: string
}

const LoginForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    email : "",
    password: "",
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("")
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name as keyof FormData]: value,
    }))
  }



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
//   {
//     "success": true,
//     "message": "Đăng nhập thành công",
//     "status": 200,
//     "data": {
//         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2OGU3NWQ2OWU4N2NmMjY3MjRiMzk0OTAiLCJpYXQiOjE3NTk5OTUwNzEsImV4cCI6MTc2MDAwNTg3MX0.rUmq0kLyCLQqGklNCzfL1S0wwVbFB0Hj3v8hvibaEMw",
//         "userID": "68e75d69e87cf26724b39490"
//     }
// }
    try {
      const res = await axios.post("http://localhost:3000/melody/auth/login", formData);  
      const data = res.data
      if (data.success === false) {
        setError("Tên đăng nhập hoặc mật khẩu không đúng!")
        setIsLoading(false)
        return
      }else if (data.success === true) {
        setError("")
        localStorage.setItem("token", data.data.token);
        navigate("/homePage");
      }
    } catch (error) {
      setError("Đăng nhập thất bại!")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
   
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-background via-primary/5 to-primary/10">
      <Card className="w-full max-w-6xl shadow-2xl border-0 bg-card/95 backdrop-blur-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Left Column - Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
                  <svg
                    className="w-8 h-8 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <div className="text-5xl font-bold text-primary mb-2 text-balance">
                  Chào mừng đến với <br />Melody Media
                </div>
                <p className="text-muted-foreground text-lg">
                  Đăng nhập để kết nối với bạn bè và chia sẻ khoảnh khắc tuyệt vời của bạn
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Tên đăng nhập
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Nhập tên đăng nhập của bạn"
                    className="h-12 border-2 border-border bg-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Mật khẩu
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu của bạn"
                    className="h-12 border-2 border-border bg-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-base"
                    required
                  />
                </div>

                {error && (
                  <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-blue-700 font-semibold text-base transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-700/30 border-t-blue-700 rounded-full animate-spin" />
                      <span className=" text-blue-700">Đang đăng nhập...</span> 
                    </div>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>


                <div className="text-center pt-4">
                  <p className="text-muted-foreground">
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 font-semibold transition-colors text-blue-400 duration-200 underline underline-offset-4"
                      onClick={()=> navigate("/signup")}
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative  from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center p-8">
            <div className="relative w-full h-full max-w-md">
              <img
                src="./src/assets/loginImg.jpg"
                alt="DTT Social Media - Kết nối và chia sẻ"
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent rounded-2xl" />

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse delay-1000" />
            </div>
          </div>
        </div>
      </Card>
    </div>

   
  )
}

export default LoginForm
