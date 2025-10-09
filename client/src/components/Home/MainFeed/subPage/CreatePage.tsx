import React, { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import axios from "axios";

interface Media {
  url: string; // cai nay de hien thi anh tren giao dien 
  file: File; // file anh de luu len server
  type: "image" | "video";
  name: string;
}

const CreatePost: React.FC = () => {
  const [caption, setCaption] = useState<string>("");
  const [privacy, setPrivacy] = useState<string>("public");
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  const [isPosting, setIsPosting] = useState<boolean>(false);

  // Người dùng chọn ảnh/video
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (!files) return;

    const newMedia: Media[] = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith("video") ? "video" : "image";
      return { url, file, type, name: file.name };
    });

    setUploadedMedia((prev) => [...prev, ...newMedia]);
  };

  // Xóa ảnh/video preview
  const removeMedia = (indexToRemove: number): void => {
    const mediaToRemove = uploadedMedia[indexToRemove];
    URL.revokeObjectURL(mediaToRemove.url);
    setUploadedMedia((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Upload 1 file lên Cloudinary qua server
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    
    const res = await axios.post(
      "http://localhost:3000/melody/post/upload-image",
      formData,
      { headers: { "Content-Type": "multipart/form-data" },
         withCredentials: false, 
      }
    );
    return res.data.imageUrl; // URL lay tu  Cloudinary tra ve 
  };

  //  Gửi bài viết
  const handlePost = async (): Promise<void> => {
    if (!caption.trim() && uploadedMedia.length === 0) return;

    setIsPosting(true);

    try {
      // Bước 1: upload toàn bộ ảnh/video lên server
      const uploadedUrls: string[] = [];
      for (const media of uploadedMedia) {
        const url = await uploadToCloudinary(media.file);
        uploadedUrls.push(url);
      }

      //  Bước 2: tạo dữ liệu bài viết
      const postData = {
        caption,
        image: uploadedUrls[0], // có thể chứa nhiều ảnh
        privacy,
      };

      //  Bước 3: gửi bài viết lên server
      const token = localStorage.getItem("token"); 
      const res = await axios.post(
        "http://localhost:3000/melody/post/create-post",
        postData,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Server response:", res.data);
      alert(" Đã đăng bài thành công!");

      // Reset lại form
      setCaption("");
      setUploadedMedia([]);
      setPrivacy("public");
    } catch (err) {
      console.error("❌ Lỗi khi đăng bài:", err);
      alert("Đăng bài thất bại!");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 text-center border-b border-slate-200 pb-4">
            Tạo bài viết
          </h2>

          {/* Thông tin user + chế độ riêng tư */}
          <div className="flex items-start gap-4 my-4">
            <img
              src="https://placehold.co/48x48/E2E8F0/4A5568?text=User"
              alt="User Avatar"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="font-semibold text-slate-800">Nguyễn Văn A</h3>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">🌍 Công khai</option>
                <option value="friend">👥 Bạn bè</option>
                <option value="private">🔒 Chỉ mình tôi</option>
              </select>
            </div>
          </div>

          {/* Caption */}
          <textarea
            placeholder="Bạn đang nghĩ gì?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full resize-none border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={4}
          />

          {/* Ảnh preview */}
          {uploadedMedia.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {uploadedMedia.map((media, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden group bg-slate-200"
                >
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      controls
                      src={media.url}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    className="absolute top-1.5 right-1.5 bg-black bg-opacity-60 text-white w-6 h-6 rounded-full flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
                    onClick={() => removeMedia(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Nút upload */}
          <div className="mt-4 flex items-center justify-between">
            <label className="cursor-pointer flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ImageIcon className="w-5 h-5" />
              <span>Thêm ảnh/video</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaUpload}
              />
            </label>
          </div>

          {/* Nút đăng */}
          <button
            onClick={handlePost}
            disabled={(!caption.trim() && uploadedMedia.length === 0) || isPosting}
            className="w-full mt-6 flex items-center justify-center py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
          >
            {isPosting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang đăng bài...
              </>
            ) : (
              "Đăng bài"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
