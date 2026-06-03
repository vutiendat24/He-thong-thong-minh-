
import { createContext, useContext, useEffect, useState } from "react"
import type Comment from '../fomat/type/Comment'
import type Post from '../fomat/type/Post'
import type { PostContextType } from '../fomat/type/PostContextType'
import axios, { AxiosError } from "axios"
import { useNavigate } from "react-router-dom"

const PostContext = createContext<PostContextType | null>(null)

export const usePostContext = () => {
  const context = useContext(PostContext)
  if (!context) throw new Error("usePostStore must be used within PostProvider")
  return context
}

const initialPosts: Post[] = [
  {
    id: "68f63e04eebbe4f3504191b4",
    userID: "user1",
    fullname: "TienDat",
    avatar: "./src/assets/ruaBien.png",
    image: "./src/assets/ruaBien.png",
    caption: "Token da het han ",
    likes: 124,
    commentCount: 8,
    isLiked: false,
    created_at: "2 giờ trước",
  },

]

const initialComments: Record<string, Comment[]> = {
  "68f5f7cb36bb15ce1b4895ee": [
    {
      id: "68e7f82fe37cde8e38d266e3",
      userID: "user2",
      fullname: "tranthibinh",
      text: "Đẹp quá!",
      created_at: "1 giờ trước",
      likes: 1,
      isLiked: true,
      replies: [
        {
          id: "r1",
          userID: "user1",
          fullname: "nguyenvanan",
          text: "Cảm ơn bạn!",
          created_at: "45 phút trước",
          likes: 1,
          isLiked: true,
          parentId: "c1",
        }
      ],
    },
  ],
}

export function PostProvider({ children }: { children: React.ReactNode }) {

  const [isLogin, setIsLogin] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Record<string, Comment[]>>({"":[]})
  // luu tru theo dang string: id cua bai viet
  //              comment[] : danh sach comment cua bai viet do

  const [currrentUserId, setCurrentUserId] = useState("")
  const navigate = useNavigate()
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
      const error = err as AxiosError
      if (error.response?.status === 401) {
        handleTokenExpired()
      }
      console.error("Lỗi khi tải bài viết:", err);
    }
  };
  useEffect(() => {
    setCurrentUserId(String(localStorage.getItem("userID")))
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
    setPosts((prevPosts) => 
        prevPosts.map((post) => 
            post.id === postId 
                ? { ...post, commentCount: (post.commentCount || 0) + 1 } 
                : post
        )
    );
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
    fetchPosts()
  }
  const getIsLogin = () => {
    return isLogin
  }

  const handleTokenExpired = () => {
    alert("Token đã hết hạn")
    setIsLogin(false)
    navigate("/")
  }

  const getComments = (postId: string) => {
    return comments[postId] || []
  }

  const updateLikePost = async (postId: String) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:3000/melody/post/${postId}/like`, 
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      if (res.data.status === 401) {
        handleTokenExpired()
      }
  
      setPosts(posts =>
        posts.map(post =>
          post.id === postId
            ? { ...post, isLiked: post.isLiked === true ? false : true }
            : post
        )
      )
      fetchPosts()
      console.log("da xu ly update like post")      
    } catch (err) {
      const error = err as AxiosError
      if(error.response?.status === 401){
        handleTokenExpired()
      }      
    }
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
    fetchPosts()
    console.log("da xu ly update like comment")
  }
  const postContextValue: PostContextType = {
    posts,
    comments,
    currrentUserId,
    updateCommentCount,
    addComment,
    addReply,
    getComments,
    getPostById,
    updateLikeComment,
    updateLikePost,
    getIsLogin,
    handleTokenExpired
  }

  return <PostContext.Provider value={postContextValue}>
    {children}
  </PostContext.Provider>
}

