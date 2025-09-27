"use client"

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import type { ApiResponse } from "../../fomat/APIfomat"

type FormData = {
  name: string
  sex: string
  email: string
  birthday: string
  password: string
  confirmPassword: string
}

const SignUpForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    sex: "Nam",
    email: "",
    birthday: "",
    password: "",
    confirmPassword: "",
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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

    if (formData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 kí tự")
      setIsLoading(false)
      return
    }
    if (formData.password != formData.confirmPassword) {
      setError("Mật khẩu không trùng khớp")
      setIsLoading(false)
      return
    }

    try {
      // chưa viết api để lưu thông tin đăng ký cua người dùng

      // tạm thoi se tu cho chuyen huong den trang dang nhap 
      navigate("/login")



    
    } catch (error) {
      
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 border border-border">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="mb-8">
            <p className="text-3xl font-bold text-primary mb-2 font-sans">
              Chào mừng đến với
              <br />
              Melody Media
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Họ và tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground"
              placeholder="Nhập họ và tên của bạn"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Giới tính</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-foreground"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Ngày sinh</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground"
              placeholder="Nhập email của bạn"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground"
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary text-blue-700 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        <div className="hidden lg:flex items-center justify-center bg-muted/30 rounded-xl p-8">
          <div className="text-center space-y-4">
            <div className="w-64 h-64 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
              <img
                src="./src/assets/loginImg.jpg"
                alt="Minh họa mạng xã hội"
                className=" object-contain opacity-80"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Tham gia cộng đồng của chúng tôi</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Kết nối với bạn bè, chia sẻ khoảnh khắc <br></br> và khám phá những trải nghiệm mới.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpForm
