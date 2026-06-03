import requests
import random
import time
import os

# ===============================
# CẤU HÌNH
# ===============================
API_BASE = "http://localhost:3000/melody/post"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2OGY2M2UwNGVlYmJlNGYzNTA0MTkxYjQiLCJpYXQiOjE3NjcwNjc0MTgsImV4cCI6MTc2NzA3ODIxOH0._P3FbYc0RHVMSd8hN4bzecMTQ8oDigPGxrLVX_5c9v4"
LOCAL_IMAGE_DIR = "./auto_post_tool/images"      # Thư mục chứa ảnh cục bộ (tùy chọn)
NUM_POSTS = 20                   # Số bài tự động đăng

# Chủ đề & caption mẫu
TOPICS = {
    # "phong cảnh": [
    #     "Cảnh đẹp khiến lòng người thư thái 🌿",
    #     "Một buổi sáng đầy năng lượng 🌤️",
    #     "Khoảnh khắc yên bình bên thiên nhiên 🍃"
    # ],
    # "thú cưng": [
    #     "Boss hôm nay đáng yêu quá 😻",
    #     "Những người bạn nhỏ luôn làm ta vui 💕",
    #     "Khoảnh khắc dễ thương của thú cưng 🐾"
    # ],
    # "chill": [
    #     "Thả hồn theo gió, để tâm trí được nghỉ ngơi 🌿",
    #     "Bình yên không ở đâu xa, chỉ là khi lòng ta an ✨",
    #     "Một tách trà, một bản nhạc, và một buổi chiều yên ả 🍵",
    #     "Chậm lại một chút, để thấy cuộc sống dịu dàng hơn 🌸",
    #     "Không cần hoàn hảo, chỉ cần bình yên là đủ 💫",
    #     "Gác lại muộn phiền, lặng nghe nhịp tim mình 💖",
    #     "Giữa cuộc sống vội vã, hãy cho mình một khoảng lặng 🍃",
    #     "Những buổi chiều nắng nhẹ, tâm hồn cũng trở nên trong trẻo ☀️",
    #     "Một ngày không cần làm gì cả, chỉ cần thấy lòng nhẹ nhõm 🌾",
    #     "Bình yên là khi không cần cố gắng để mỉm cười 🌼",
    #     "Có những khoảnh khắc nhỏ bé lại khiến ta thấy đủ đầy 💛",
    #     "Hạnh phúc thật ra chỉ là một tâm hồn biết an nhiên 🌙",
    #     "Bước chậm lại, hít thở sâu và mỉm cười với hiện tại 🍀",
    #     "Âm nhạc nhẹ nhàng, lòng người cũng dịu đi 🎵",
    #     "Đôi khi, bình yên chính là không cần nghĩ gì cả 🌊",
    #     "Một buổi chiều gió nhẹ, tách cà phê và cuốn sách yêu thích ☕📖",
    #     "Hãy để mọi thứ diễn ra tự nhiên, như mây bay qua trời ☁️",
    #     "Thế giới ồn ào, ta chọn bình yên 🌻",
    #     "Tâm an, vạn sự an 💭",
    #     "Chill một chút để thấy cuộc đời vẫn thật đẹp 💕"
    # ],
    "bóng rổ": [
    "Tinh thần thể thao không bao giờ gục ngã 💪",
    "Thắng không kiêu, bại không nản ⚡",
    "Không có giới hạn nào cho nỗ lực 🏃",
    "Chỉ cần bạn không dừng lại, con đường sẽ luôn mở ra 🚀",
    "Đổ mồ hôi hôm nay để tỏa sáng ngày mai 🌟",
    "Thể thao dạy ta cách vượt qua giới hạn bản thân 💯",
    "Không chỉ là trò chơi, mà là đam mê ❤️",
    "Cảm giác chiến thắng đến từ sự kiên trì từng ngày 🏆",
    "Một trận đấu – hàng nghìn cảm xúc 🔥",
    "Tập luyện không bao giờ phản bội ai 💥",
    "Thể thao là cuộc sống, là năng lượng, là đam mê 🔥",
    "Không có đường tắt nào đến với thành công 🏋️‍♂️",
    "Kỷ luật là cầu nối giữa mục tiêu và thành tựu 🧠",
    "Cứ cố gắng thêm một chút mỗi ngày, bạn sẽ thấy khác biệt 💫",
    "Thể thao giúp ta mạnh mẽ hơn, kiên cường hơn 💪",
    "Đừng sợ thất bại – đó là bước đầu của chiến thắng 🏁",
    "Mỗi giọt mồ hôi là một bước gần hơn đến đỉnh cao ⛰️",
    "Không ai sinh ra đã giỏi, chỉ có người không ngừng cố gắng 💥",
    "Đam mê và nỗ lực – công thức của nhà vô địch 🏅",
    "Thể thao không chỉ rèn thể lực, mà còn rèn ý chí 🧩"
    ]
}

# ===============================
# HÀM UPLOAD ẢNH LÊN CLOUDINARY
# ===============================
def upload_image_to_cloudinary(image_path):
    url = f"{API_BASE}/upload-image"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    with open(image_path, "rb") as img_file:
        files = {"image": img_file}
        res = requests.post(url, files=files, headers=headers)
    if res.status_code == 200:
        return res.json().get("imageUrl")
    else:
        print("❌ Lỗi upload ảnh:", res.status_code, res.text)
        return None

# ===============================
# HÀM TẠO BÀI VIẾT
# ===============================
def create_post(caption, image_url, privacy="public"):
    url = f"{API_BASE}/create-post"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    payload = {"caption": caption, "image": image_url, "privacy": privacy}
    res = requests.post(url, json=payload, headers=headers)
    if res.status_code in [200, 201]:
        print(f"✅ Đăng bài thành công: {caption}")
    else:
        print(f"❌ Lỗi khi đăng bài: {res.status_code} - {res.text}")

# ===============================
# TOOL TỰ ĐỘNG ĐĂNG BÀI
# ===============================
def auto_post():
    all_images = [os.path.join(LOCAL_IMAGE_DIR, f)
                  for f in os.listdir(LOCAL_IMAGE_DIR)
                  if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

    if not all_images:
        print("⚠️ Không tìm thấy ảnh trong thư mục 'images'")
        return

    for i in range(NUM_POSTS):
        topic = random.choice(list(TOPICS.keys()))
        caption = random.choice(TOPICS[topic])
        image_path = random.choice(all_images)

        print(f"\n🖼️ Chủ đề: {topic}")
        print(f"📤 Uploading {os.path.basename(image_path)}...")

        image_url = upload_image_to_cloudinary(image_path)
        if image_url:
            create_post(caption, image_url)

        time.sleep(2)

if __name__ == "__main__":
    auto_post()