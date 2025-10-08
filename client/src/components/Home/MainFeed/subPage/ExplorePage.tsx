import React, { useState } from 'react';
import CommentsOverlay from './CommentOverlay';
import type Post  from "../../../../fomat/type/Post"
import { usePostContext } from "../../../../context/PostContext"


export default function ExplorePage() {
  const {posts,getPostById,addComment,updateLikePost} = usePostContext()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
   const handleOpenComments = (post: Post) => {
          setSelectedPost(post)
          setIsCommentsOpen(true)
      }
  
      const handleCloseComments = () => {
          setIsCommentsOpen(false)
          setSelectedPost(null)
      }
  const exploreItems = [
        {
            "id": "68e62d8b53fdebb5154c1d10",
            "userId": "68e625fd737a630e4d6d6656",
            "fullname": "Vu Tien Dat",
            "image": "https://res.cloudinary.com/dsfgzdr5z/image/upload/v1759915403/popwoglhpnuug7oqyn86.png",
            "caption": "sadasd",
            "likes": 0,
            "commentCount": 0,
            "isLiked": false,
            "time": "2 giờ trước",
            "privacy": "public"
        },
        {
            "id": "68e62adfffb358fbacc76f88",
            "userId": "68e625fd737a630e4d6d6656",
            "fullname": "Vu Tien Dat",
            "image": "https://res.cloudinary.com/dsfgzdr5z/image/upload/v1759914719/a3gagng8amnxhklxlslj.png",
            "caption": "sss",
            "likes": 0,
            "commentCount": 0,
            "isLiked": false,
            "time": "2 giờ trước",
            "privacy": "public"
        },
        {
            "id": "68e62a8c1e6a7cc6edce63ff",
            "userId": "68e6230de6a74cdcadc88bcc",
            "fullname": "Ẩn danh",
            "avatar": "",
            "image": "https://res.cloudinary.com/dsfgzdr5z/image/upload/v1759914635/dbngxumvmzgxe95bilny.png",
            "caption": "ssdd",
            "likes": 0,
            "commentCount": 0,
            "isLiked": false,
            "time": "2 giờ trước",
            "privacy": "public"
        },
        {
            "id": "68e62615737a630e4d6d665d",
            "userId": "68e6230de6a74cdcadc88bcc",
            "fullname": "Ẩn danh",
            "avatar": "",
            "image": "https://res.cloudinary.com/dsfgzdr5z/image/upload/v1759913492/njwouuyii00xotfqiugx.png",
            "caption": "asasa",
            "likes": 0,
            "commentCount": 0,
            "isLiked": false,
            "time": "2 giờ trước",
            "privacy": "public"
        }
    ]


  
  return (
    <div className="h-screen overflow-y-auto scrollbar-hide">
      <div className="p-4 lg:p-8">
        <h2 className="text-xl font-semibold mb-6">Khám phá</h2>
        <div className="grid grid-cols-3 gap-1">
          {exploreItems.map((item) => (
            <div key={item.id} className="aspect-square bg-gray-100 relative">
              <img
                src={item.image || "/placeholder.svg"}
                alt={`Explore item ${item.id}`}
                className="w-full h-full object-cover"
                onClick={() =>{
                  console.log("Clicked item ID:", item.id);
                    handleOpenComments(item)                  
                }}
                  
              />
              
            </div>
          ))}
        </div>
        <CommentsOverlay 
                        post={selectedPost} 
                        isOpen={isCommentsOpen} 
                        onClose={handleCloseComments}
                        onUpdateComments={addComment}
                    />
      </div>
    </div>
  )
}