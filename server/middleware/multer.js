import multer from "multer";

// Dùng memoryStorage để không lưu file ra ổ đĩa
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // giới hạn 50MB
});

export default upload;
