import React, { useState } from "react";
import { ImageIcon, Smile, MapPin, Gift, Palette, Loader2 } from "lucide-react";

// --- TypeScript Definitions ---
interface BackgroundColor {
  name: string;
  value: string;
  color: string;
}

interface Feeling {
  emoji: string;
  text: string;
}

interface Media {
  url: string;
  type: 'image' | 'video';
  name: string;
}

// --- Mock Data ---
const backgroundColors: BackgroundColor[] = [
  { name: "Mặc định", value: "default", color: "transparent" },
  { name: "Gradient xanh", value: "blue", color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Gradient hồng", value: "pink", color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Gradient cam", value: "orange", color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { name: "Gradient tím", value: "purple", color: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
];

const feelings: Feeling[] = [
  { emoji: "😊", text: "vui vẻ" },
  { emoji: "😍", text: "yêu thích" },
  { emoji: "😎", text: "tự tin" },
  { emoji: "🤔", text: "suy nghĩ" },
  { emoji: "😴", text: "buồn ngủ" },
  { emoji: "🎉", text: "phấn khích" },
];

// --- Main Component ---
const App: React.FC = () => {
  const [postText, setPostText] = useState<string>("");
  const [selectedBackground, setSelectedBackground] = useState<string>("default");
  const [privacy, setPrivacy] = useState<string>("public");
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(null);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);

  // Handler for posting content
  const handlePost = async (): Promise<void> => {
    setIsPosting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Posted:", {
        text: postText,
        media: uploadedMedia,
        privacy: privacy,
        feeling: selectedFeeling,
        background: selectedBackground,
    });
    setIsPosting(false);
    // Reset form state after posting
    setPostText("");
    setSelectedBackground("default");
    setSelectedFeeling(null);
    setUploadedMedia([]);
  };

  // Handler for file selection (images/videos)
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (files) {
      const newMedia: Media[] = Array.from(files).map((file) => {
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith("video") ? "video" : "image";
        return { url, type, name: file.name };
      });
      setUploadedMedia((prev) => [...prev, ...newMedia]);
    }
  };

  // Handler for removing an uploaded media item
  const removeMedia = (indexToRemove: number): void => {
    const mediaToRemove = uploadedMedia[indexToRemove];
    URL.revokeObjectURL(mediaToRemove.url);
    setUploadedMedia((prev) => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const selectedBg = backgroundColors.find((bg) => bg.value === selectedBackground);
  const isPostButtonDisabled: boolean = (!postText.trim() && uploadedMedia.length === 0) || isPosting;

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200/80">
          <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 text-center border-b border-slate-200 pb-4">Tạo bài viết</h2>
            {/* User Info and Privacy */}
            <div className="flex items-start gap-4 my-4">
              <img 
                src="https://placehold.co/48x48/E2E8F0/4A5568?text=User" 
                alt="User Avatar" 
                className="w-12 h-12 rounded-full" 
              />
              <div >
                <h3 className="font-semibold text-slate-800">Nguyễn Văn A</h3>
                <select
                  value={privacy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPrivacy(e.target.value)}
                  className="text-xs px-2 py-1 rounded-md bg-slate-100 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">🌍 Công khai</option>
                  <option value="friends">👥 Bạn bè</option>
                  <option value="private">🔒 Chỉ mình tôi</option>
                </select>
              </div>
            </div>

            {/* Content Input Area */}
            <div className="mb-4">
              <div
                className="relative rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  background: selectedBg?.color !== "transparent" ? selectedBg?.color : "transparent",
                  minHeight: selectedBackground !== "default" ? "200px" : "auto",
                }}
              >
                <textarea
                  placeholder={selectedBackground !== 'default' ? 'Viết gì đó...' : 'Bạn đang nghĩ gì?'}
                  value={postText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPostText(e.target.value)}
                  className={`w-full resize-none border-none bg-transparent text-lg placeholder-slate-500 focus:ring-0 focus:outline-none p-3 ${
                    selectedBackground !== "default"
                      ? "text-white placeholder-white/80 text-center flex items-center justify-center min-h-[200px] text-3xl font-bold"
                      : "text-slate-800"
                  }`}
                  style={selectedBackground !== "default" ? {textShadow: '0 2px 4px rgba(0,0,0,0.2)'} : {}}
                  rows={selectedBackground !== "default" ? 1 : 4}
                />
              </div>

              {selectedFeeling && (
                <div className="mt-3 inline-flex items-center bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                  <span className="mr-2">{selectedFeeling.emoji}</span>
                   Đang cảm thấy {selectedFeeling.text}
                </div>
              )}

              {/* Media Preview Area */}
              {uploadedMedia.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {uploadedMedia.map((media, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-slate-200">
                      {media.type === 'image' ? (
                        <img src={media.url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <video controls src={media.url} className="w-full h-full object-cover" />
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
            </div>
            
            <div className="border rounded-lg p-3 flex flex-wrap justify-between items-center gap-2 mb-4">
                <span className="text-sm font-medium text-slate-600">Thêm vào bài viết</span>
                <div className="flex items-center gap-1">
                    <label className="cursor-pointer p-2 rounded-full hover:bg-slate-100 transition-colors">
                      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                      <ImageIcon className="w-6 h-6 text-green-500" />
                    </label>

                    <button
                      className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                      onClick={() => setSelectedFeeling(feelings[Math.floor(Math.random() * feelings.length)])}
                    >
                      <Smile className="w-6 h-6 text-yellow-500" />
                    </button>

                    <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                      <MapPin className="w-6 h-6 text-red-500" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                      <Gift className="w-6 h-6 text-blue-500" />
                    </button>
                </div>
            </div>

            {/* Background Selector */}
            <div className="flex items-center gap-2 mb-5">
                 <Palette className="w-5 h-5 text-slate-500" />
                 {backgroundColors.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => setSelectedBackground(bg.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${selectedBackground === bg.value ? 'border-blue-500 scale-110' : 'border-slate-300'}`}
                      style={{ background: bg.color === 'transparent' ? '#f1f5f9' : bg.color }}
                      title={bg.name}
                    />
                  ))}
            </div>

            {/* Post Button */}
            <button
              onClick={handlePost}
              disabled={isPostButtonDisabled}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
            >
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng bài"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

