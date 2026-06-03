require("dotenv").config();
const mongoose = require("mongoose");
const neo4j = require("neo4j-driver");
const User = require("../models/User"); // Import model User (export default)

// ====== Tạo driver Neo4j ======
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// ====== Kết nối và kiểm tra Neo4j ======
const ConnectNeo4j = async () => {
  try {
    const session = driver.session({ database: process.env.NEO4J_DATABASE });
    await session.run("RETURN 1");
    console.log("✅ Kết nối Neo4j thành công!");
    await session.close();
  } catch (err) {
    console.error("❌ Neo4j connection error:", err);
  }
};

// ====== Đồng bộ người dùng và quan hệ bạn bè ======
const syncUsersToNeo4j = async () => {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });

  try {
    // Kết nối MongoDB (chỉ khi chưa kết nối)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_CLOUD_URI);
      console.log("✅ Kết nối MongoDB thành công!");
    }

    const users = await User.find();
    console.log(`📦 Tìm thấy ${users.length} người dùng để đồng bộ.`);

    for (const user of users) {
      // 1️⃣ Tạo node người dùng
      await session.run(
        ` MERGE (u:User {id: $id})
        SET 
          u.fullname = $fullname,
          u.email = $email,
          u.avatar = $avatar,
          u.birthday = $birthday,
          u.createdAt = $createdAt,
          u.totalFollower = $totalFollower
        `,
        {
          id: user._id.toString(),
          fullname: user.fullname,
          email: user.email,
          avatar: user.avatar || "",
          birthday: user.birthday ? user.birthday.toISOString() : null,
          createdAt: user.createdAt ? user.createdAt.toISOString() : null,
          totalFollower: user.totalFollower ? neo4j.int(user.totalFollower) : 0,
        }
      );
    }

    console.log("🎉 Đồng bộ người dùng và bạn bè hoàn tất!");
  } catch (err) {
    console.error("❌ Lỗi khi đồng bộ người dùng:", err);
  } finally {
    await session.close();
    // ❗ KHÔNG đóng driver hoặc Mongo ở đây, vì app vẫn chạy sau đó
  }
};

// ====== Xuất module ======
module.exports = {
  driver,
  ConnectNeo4j,
  syncUsersToNeo4j,
};
