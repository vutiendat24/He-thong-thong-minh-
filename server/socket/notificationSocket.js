const {onlineUsers} = require("./index")

function notificationSocket(io, socket){
 

  socket.on("likePost", (data) =>{
    const {postID, ownerID, likerID } = data
    console.log(`User ${likerID} liked post ${postID}`)
    const targetSocketID = onlineUsers.get(ownerID)
    if(targetSocketID){
      socket.to(targetSocketID).emit("receiveNotification",{
        mesage : `Người dùng ${likerId} đã thích bài viết của bạn `,
        postID
      })
    }
  })
  socket.on("disconnect", ()=>{
    onlineUsers.delete(socket.userID)
  })
  socket.on("test", ()=>{
    console.log("test socket gui thong bao")
  })
}
module.exports = {notificationSocket}