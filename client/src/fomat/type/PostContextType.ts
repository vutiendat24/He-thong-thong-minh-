
import type  Comment  from "./Comment";
import type Post  from "./Post";


export type PostContextType = {
   posts: Post[]
   comments: Record<string, Comment[]>
    updateCommentCount: (postId: string, newCount: number) => void
    addComment: (postId: string, comment: Comment) => void
    addReply: (postId: string, parentCommentId: string, reply: Comment) => void
    getComments: (postId: string) => Comment[]
    updateLikeComment : (postId: string, commentId: string) =>void
    updateLikePost : (postId: string ) => void,
    getIsLogin: () => boolean,
    setIsUserLogin : (status: boolean) => void,
}