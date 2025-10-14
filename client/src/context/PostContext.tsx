
import { createContext, useContext, useEffect, useState } from "react"
import type Comment from '../fomat/type/Comment'
import type Post from '../fomat/type/Post'
import type { PostContextType } from '../fomat/type/PostContextType'
import axios from "axios"



const PostContext = createContext<PostContextType | null>(null)

export const usePostContext = () => {
  const context = useContext(PostContext)
  if (!context) throw new Error("usePostStore must be used within PostProvider")
  return context
}

const initialPosts: Post[] = [
  {
    id: "1",
    userID: "user1",
    fullname: "TienDat",
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
    userID: "user2",
    fullname: "MINH BEO OFFICAL",
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
    userID: "user3",
    fullname: "TienDat Vu",
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
      userID: "user2",
      fullname: "tranthibinh",
      text: "Đẹp quá!",
      time: "1 giờ trước",
      likes: 1,
      isLiked: true,
      replies: [
        {
          id: "r1",
          userID: "user1",
          fullname: "nguyenvanan",
          text: "Cảm ơn bạn!",
          time: "45 phút trước",
          likes: 1,
          isLiked: true,
          parentId: "c1",
        }, {
          id: "r2",
          userID: "user1",
          fullname: "namcuong",
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
      userID: "user3",
      fullname: "leminhcuong",
      text: "Chụp ở đâu vậy bạn?",
      time: "30 phút trước",
      likes: 1,
      isLiked: true,
      replies: [],
    },
  ],
  "2": [
    { id: "c3", userID: "user1", fullname: "nguyenvanan", text: "Nhìn ngon ghê!", time: "2 giờ trước", likes: 1, isLiked: true, replies: [] },
    {
      id: "c4",
      userID: "user3",
      fullname: "leminhcuong",
      text: "Công thức chia sẻ được không?",
      time: "1 giờ trước",
      likes: 1,
      isLiked: true,
      replies: [{
        id: "r8",
        userID: "user1",
        fullname: "nguyen",
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
      userID: "user1",
      fullname: "nguyenvanan",
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

  const [currrenUserId, setCurrentUserId] = useState("")

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // 🔹 Lấy token từ localStorage
        const token = localStorage.getItem("token");
        // 🔹 Gọi API kèm JWT token 
        const response = await axios.get("http://localhost:3000/melody/post/get-posts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data: Post[] = response.data.data;
        setPosts(data);
      } catch (err) {
        console.error("Lỗi khi tải bài viết:", err);
      }
    };
    fetchPosts();
  }, []);




  const getPostById = (postID: string): Post | undefined => {
    return posts.find((post) => post.id === postID)
  }
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
  const updateLikePost = async (postId: String) => {

 
    const token = localStorage.getItem("token"); 

      const res = await axios.post(`http://localhost:3000/melody/post/${postId}/like`, {},
        {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
    currrenUserId,
    updateCommentCount,
    addComment,
    addReply,
    getComments,
    getPostById,
    updateLikeComment,
    updateLikePost,
    getIsLogin,
    setIsUserLogin,
  }

  return <PostContext.Provider value={postContextValue}>
    {children}
  </PostContext.Provider>
}

