
import { createContext, useContext, useState } from "react"
import type Comment from '../fomat/type/Comment'
import type Post from '../fomat/type/Post'
import type { PostContextType } from '../fomat/type/PostContextType'



const PostContext = createContext<PostContextType | null>(null)

export const usePostContext = () => {
  const context = useContext(PostContext)
  if (!context) throw new Error("usePostStore must be used within PostProvider")
  return context
}

const initialPosts: Post[] = [
  {
    id: "1",
    userId: "user1",
    username: "TienDat",
    avatar: "./src/assets/ruaBien.png",
    image: "./src/assets/ruaBien.png",
    caption: "Cảnh đẹp hôm nay! 🌅 #sunrise #nature",
    likes: 124,
    commentCount: 8,
    isLiked: false,
    time: "2 giờ trước",
  },
  {
    id: "2",
    userId: "user2",
    username: "MINH BEO OFFICAL",
    avatar: "./src/assets/romanWarrior.jpg",
    image: "./src/assets/nuochoaMinhBeo.jpg",
    caption: "NUOC HOA MINH BEO",
    likes: 89,
    commentCount: 12,
    isLiked: true,
    time: "4 giờ trước",
  },
  {
    id: "3",
    userId: "user3",
    username: "TienDat Vu",
    avatar: "./src/assets/romanWarrior.jpg",
    image: "./src/assets/hinh-avatar-cute-nu.webp",
    caption: "Thành phố về đêm ✨ #citylife #night",
    likes: 256,
    commentCount: 23,
    isLiked: false,
    time: "6 giờ trước",
  },
]

const initialComments: Record<string, Comment[]> = {
  "1": [
    {
      id: "c1",
      userId: "user2",
      username: "tranthibinh",
      text: "Đẹp quá!",
      time: "1 giờ trước",
      likes: 1,
      isLiked: true,
      replies: [
        {
          id: "r1",
          userId: "user1",
          username: "nguyenvanan",
          text: "Cảm ơn bạn!",
          time: "45 phút trước",
          likes: 1,
          isLiked: true,
          parentId: "c1",
        }, {
          id: "r2",
          userId: "user1",
          username: "namcuong",
          text: "Cảm ơn bạn!",
          time: "45 phút trước",
          likes: 1,
          isLiked: true,
          parentId: "c1",
        }
      ],
    },
    {
      id: "c2",
      userId: "user3",
      username: "leminhcuong",
      text: "Chụp ở đâu vậy bạn?",
      time: "30 phút trước",
      likes: 1,
      isLiked: true,
      replies: [],
    },
  ],
  "2": [
    { id: "c3", userId: "user1", username: "nguyenvanan", text: "Nhìn ngon ghê!", time: "2 giờ trước", likes: 1, isLiked: true, replies: [] },
    {
      id: "c4",
      userId: "user3",
      username: "leminhcuong",
      text: "Công thức chia sẻ được không?",
      time: "1 giờ trước",
      likes: 1,
      isLiked: true,
      replies: [{
        id: "r8",
        userId: "user1",
        username: "nguyen",
        text: "Cảm ơn bạn!",
        time: "45 phút trước",
        likes: 1,
        isLiked: true,
        parentId: "c1",
      }],
    },
  ],
  "3": [
    {
      id: "c5",
      userId: "user1",
      username: "nguyenvanan",
      text: "Góc chụp tuyệt vời!",
      time: "3 giờ trước",
      likes: 1,
      isLiked: true,
      replies: [],
    },
  ],
}

export function PostProvider({ children }: { children: React.ReactNode }) {

  const [isLogin, setIsLogin] = useState(false)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [comments, setComments] = useState<Record<string, Comment[]>>(initialComments)
  // luu tru theo dang string: id cua bai viet
  //              comment[] : danh sach comment cua bai viet do
  const updateCommentCount = (postId: string, newCount: number) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, commentCount: newCount } : post)))
  }

  const addComment = (postId: string, comment: Comment) => {
    const commentWithReplies = { ...comment, replies: [] }
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), commentWithReplies],
    }))
  }

  const addReply = (postId: string, parentCommentId: string, reply: Comment) => {
    setComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).map((comment) =>
        comment.id === parentCommentId
          ? { ...comment, replies: [...(comment.replies || []), { ...reply, parentId: parentCommentId }] }
          : comment,
      ),
    }))
  }
  const getIsLogin = () => {
    return isLogin
  }
  const setIsUserLogin = (status: boolean) => {
    setIsLogin(status)
  }
  const getComments = (postId: string) => {
    return comments[postId] || []
  }
  const updateLikePost = (postId: String) => {

    setPosts(posts =>
      posts.map(post =>
        post.id === postId
          ? { ...post, isLiked: post.isLiked === true ? false : true }
          : post
      )
    )
    console.log("da xu ly update like post")

  }
  const updateLikeComment = (postId: string, commentId: string) => {
    if (comments[postId]) {
      setComments(prevComments => ({
        ...prevComments,
        [postId]: prevComments[postId].map(comment =>
          comment.id === commentId
            ? { ...comment, isLiked: !comment.isLiked }
            : comment
        )
      }));
    }
   console.log("da xu ly update like comment")
  }
  const postContextValue: PostContextType = {
    posts,
    comments,
    updateCommentCount,
    addComment,
    addReply,
    getComments,
    updateLikeComment,
    updateLikePost,
    getIsLogin,
    setIsUserLogin,
  }

  return <PostContext.Provider value={postContextValue}>
    {children}
  </PostContext.Provider>
}

