"use client";

import { createComment, deleteComment, deletePost, getPosts, toggleLike, rateComment } from "@/actions/post.action";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import DesignationBadge from "./DesignationBadge";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Avatar, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { Button } from "./ui/button";
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon, TrashIcon } from "lucide-react";
import { Textarea } from "./ui/textarea";
import DynamicPDFSlider from "./DynamicPDFSlider";
import UserHoverCard from "./UserHoverCard";
import StarRating from "./StarRating";
import CodeBlock from "./CodeBlock";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];

function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
  const [user, setUser] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [optimisticLikes, setOptmisticLikes] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some(like => like.userId === dbUserId));
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [ratingCommentId, setRatingCommentId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  // Local state for comments
  const [comments, setComments] = useState(post.comments);

  // Calculate total comment count (including replies)
  const getTotalCommentCount = () => {
    return comments.reduce((total: number, comment: any) => {
      // Count the comment itself + all its replies
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  // Update like status when dbUserId changes
  useEffect(() => {
    setHasLiked(post.likes.some(like => like.userId === dbUserId));
  }, [dbUserId, post.likes]);

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLike = async () => {
    if (isLiking || !user) return;
    try {
      setIsLiking(true);

      // Optimistically update the UI
      const newHasLiked = !hasLiked;
      setHasLiked(newHasLiked);
      setOptmisticLikes(prev => prev + (newHasLiked ? 1 : -1));

      // Make the API call
      const result = await toggleLike(post.id, user.uid);
      if (!result.success) throw new Error(result.error);

      // The server action will update the likes in the database,
      // and the next page refresh will show the correct state
    } catch (error) {
      // Revert optimistic updates if there's an error
      setHasLiked(!hasLiked);
      setOptmisticLikes(post._count.likes);
      toast.error("Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting || !user) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, newComment, user.uid);
      if (result?.success) {
        toast.success("Comment posted successfully");
        setNewComment("");
        // Add the new comment to local state for real-time update
        if (result.comment) {
          setComments(prev => [result.comment, ...prev]);
        }
      } else {
        throw new Error(result?.error || "Failed to post comment");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim() || isCommenting || !user) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, replyContent, user.uid, parentId);
      if (result?.success) {
        toast.success("Reply posted successfully");
        setReplyContent("");
        setReplyingToId(null);
        // Add the reply to the parent comment's replies in local state
        if (result.comment) {
          setComments(prev => prev.map(comment =>
            comment.id === parentId
              ? { ...comment, replies: [...(comment.replies || []), result.comment] }
              : comment
          ));
        }
      } else {
        throw new Error(result?.error || "Failed to post reply");
      }
    } catch (error) {
      toast.error("Failed to add reply");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingToId(commentId);
    setReplyContent(`@${username} `);
    // Focus on the reply textarea
    setTimeout(() => {
      const textarea = document.querySelector(`#reply-textarea-${commentId}`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        // Set cursor at the end
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;
      }
    }, 100);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      setDeletingCommentId(commentId);
      const result = await deleteComment(commentId, user.uid);
      if (result?.success) {
        toast.success("Comment deleted successfully");
        // Remove the comment or reply from local state for real-time update
        setComments(prev => prev.map(comment => {
          // If the deleted item is a reply, remove it from the parent's replies
          if (comment.replies && comment.replies.some((r: any) => r.id === commentId)) {
            return {
              ...comment,
              replies: comment.replies.filter((r: any) => r.id !== commentId)
            };
          }
          return comment;
        }).filter(comment => comment.id !== commentId)); // Also filter out if it's a top-level comment
      } else {
        throw new Error(result?.error || "Failed to delete comment");
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting || !user) return;
    try {
      setIsDeleting(true);
      // Optimistically hide the post
      setIsDeleted(true);
      const result = await deletePost(post.id, user.uid);
      if (result.success) {
        toast.success("Post deleted successfully");
      } else {
        // If deletion fails, show the post again
        setIsDeleted(false);
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRateComment = async (commentId: string, rating: number) => {
    if (!user || ratingCommentId === commentId) return;
    try {
      setRatingCommentId(commentId);

      // Optimistically update the comment rating
      setComments(prev => prev.map(comment =>
        comment.id === commentId
          ? { ...comment, rating }
          : comment
      ));

      const result = await rateComment(commentId, rating, user.uid);
      if (result.success) {
        toast.success(`Comment rated ${rating} star${rating !== 1 ? 's' : ''}!`);
      } else {
        // Revert optimistic update on error
        setComments(prev => prev.map(comment =>
          comment.id === commentId
            ? { ...comment, rating: comment.rating }
            : comment
        ));
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Failed to rate comment");
    } finally {
      setRatingCommentId(null);
    }
  };

  // Don't render the card if it's been deleted
  if (isDeleted) return null;

  return (
    <div className="group relative bg-gray-900 border border-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Post Header */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <UserHoverCard
            userId={post.author.id}
            username={post.author.username}
            currentUserId={dbUserId}
          >
            <Link href={`/profile/${post.author.username}`}>
              <Avatar className="w-10 h-10 ring-2 ring-gray-700 hover:ring-purple-500 transition-all">
                <AvatarImage src={post.author.image ?? "/avatar.png"} />
              </Avatar>
            </Link>
          </UserHoverCard>
          <div className="flex-1">
            <div className="flex items-center">
              <UserHoverCard
                userId={post.author.id}
                username={post.author.username}
                currentUserId={dbUserId}
              >
                <Link
                  href={`/profile/${post.author.username}`}
                  className="font-semibold text-white hover:text-purple-400 transition-colors"
                >
                  {post.author.name || post.author.username}
                </Link>
              </UserHoverCard>
              <DesignationBadge designation={post.author.designation as 'STUDENT' | 'TEACHER' | 'WORKING_PROFESSIONAL' | null} size="sm" className="ml-2" />
            </div>
            <p className="text-sm text-gray-400">
              @{post.author.username} · {formatDistanceToNow(new Date(post.createdAt))} ago
            </p>
          </div>

          {/* Delete button for post owner */}
          {dbUserId === post.author.id && (
            <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
          )}
        </div>
      </div>

      {/* Divider after profile section - full width */}
      <div className="border-t border-gray-700"></div>

      {/* Post Content */}
      <div className="p-6 py-4">
        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* Post Media - Image, PDF, or Code */}
      {post.fileUrl && (
        <div className="px-6 pb-4">
          {post.fileType === "pdf" ? (
            <DynamicPDFSlider fileUrl={post.fileUrl} className="w-full" />
          ) : post.fileType === "code" ? (
            <CodeBlock
              fileUrl={post.fileUrl}
              fileName={post.fileName || undefined}
              fileExtension={post.fileExtension || undefined}
            />
          ) : (
            <div className="relative w-full h-96 lg:h-[30rem] rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
              <img
                src={post.fileUrl}
                alt="Post content"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      )}      {/* Divider before actions - full width */}
      <div className="border-t border-gray-700"></div>

      {/* Post Actions */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-6">{/* Like Button */}
          {user ? (
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 transition-colors cursor-pointer ${hasLiked
                ? "text-red-500"
                : "text-gray-400 hover:text-red-500"
                }`}
            >
              <HeartIcon className={`w-5 h-5 ${hasLiked ? "fill-current" : ""}`} />
              <span className="text-sm">{optimisticLikes}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const provider = new GoogleAuthProvider();
                signInWithPopup(auth, provider);
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <HeartIcon className="w-5 h-5" />
              <span className="text-sm">{optimisticLikes}</span>
            </button>
          )}

          {/* Comment Button */}
          <button
            onClick={() => setShowComments((prev) => !prev)}
            className={`flex items-center gap-2 transition-colors cursor-pointer ${showComments
              ? "text-blue-500"
              : "text-gray-400 hover:text-blue-500"
              }`}
          >
            <MessageCircleIcon className={`w-5 h-5 ${showComments ? "fill-current" : ""}`} />
            <span className="text-sm">{getTotalCommentCount()}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 py-4 border-t border-gray-800 bg-gradient-to-b from-gray-900/30 to-gray-900/10">
          <div className="space-y-4">
            {/* Display Comments */}
            {comments.map((comment, index) => (
              <div key={comment.id} className="group">
                {index > 0 && <div className="border-t border-gray-800/30 mb-4"></div>}
                <div className="flex space-x-3">
                  <UserHoverCard
                    userId={comment.author.id}
                    username={comment.author.username}
                    currentUserId={dbUserId}
                  >
                    <Link href={`/profile/${comment.author.username}`}>
                      <Avatar className="w-10 h-10 flex-shrink-0 hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer ring-1 ring-gray-700">
                        <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                      </Avatar>
                    </Link>
                  </UserHoverCard>
                  <div className="flex-1 min-w-0">
                    {/* Comment Header */}
                    <div className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800/70 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <UserHoverCard
                            userId={comment.author.id}
                            username={comment.author.username}
                            currentUserId={dbUserId}
                          >
                            <Link
                              href={`/profile/${comment.author.username}`}
                              className="font-semibold text-sm text-white hover:text-purple-400 transition-colors"
                            >
                              {comment.author.name || comment.author.username}
                            </Link>
                          </UserHoverCard>
                          {comment.author.designation && (
                            <DesignationBadge
                              designation={comment.author.designation as 'STUDENT' | 'TEACHER' | 'WORKING_PROFESSIONAL'}
                              size="sm"
                            />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                          </span>
                          {/* Delete button - only show for comment author */}
                          {user && dbUserId && comment.author.id === dbUserId && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                              className="text-gray-500 hover:text-red-400 transition-all p-1.5 rounded-full hover:bg-gray-700 disabled:opacity-50"
                              title="Delete comment"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-200 break-words leading-relaxed">{comment.content}</p>
                    </div>

                    {/* Action Buttons (Reply, Rate) */}
                    <div className="mt-2 ml-3 flex items-center space-x-6">
                      {/* Reply Button */}
                      {user && (
                        <button
                          onClick={() => handleReplyClick(comment.id, comment.author.username)}
                          className={`text-xs font-medium transition-colors flex items-center space-x-1.5 ${replyingToId === comment.id
                            ? 'text-purple-400'
                            : 'text-gray-400 hover:text-purple-400'
                            }`}
                        >
                          <MessageCircleIcon className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      )}

                      {/* Show reply count if there are replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      )}

                      {/* Star Rating - only visible to post author */}
                      {user && dbUserId && post.author.id === dbUserId && comment.author.id !== dbUserId && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 font-medium">Rate:</span>
                          <StarRating
                            rating={comment.rating || 0}
                            onRatingChange={(rating) => handleRateComment(comment.id, rating)}
                            size="sm"
                            loading={ratingCommentId === comment.id}
                          />
                        </div>
                      )}

                      {/* Show existing rating to everyone if rated */}
                      {comment.rating && comment.rating > 0 && !(user && dbUserId && post.author.id === dbUserId && comment.author.id !== dbUserId) && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Rated:</span>
                          <StarRating
                            rating={comment.rating}
                            readonly
                            size="sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Reply Input */}
                    {replyingToId === comment.id && user && (
                      <div className="mt-3 ml-3 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                        <div className="flex space-x-2">
                          <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-gray-700">
                            <AvatarImage src={user?.photoURL || "/avatar.png"} />
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              id={`reply-textarea-${comment.id}`}
                              placeholder={`Reply to @${comment.author.username}...`}
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="min-h-[70px] resize-none bg-gray-900/50 border-gray-600 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500/30 rounded-lg"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && replyContent.trim()) {
                                  handleAddReply(comment.id);
                                }
                              }}
                            />
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-500">Ctrl+Enter to send</span>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingToId(null);
                                    setReplyContent("");
                                  }}
                                  className="text-xs h-8 border-gray-700 hover:bg-gray-800"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddReply(comment.id)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-4"
                                  disabled={!replyContent.trim() || isCommenting}
                                >
                                  {isCommenting ? (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      <span>Posting...</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1">
                                      <SendIcon className="w-3 h-3" />
                                      <span>Reply</span>
                                    </div>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-3 space-y-3 border-l-2 border-purple-900/30 pl-6">
                        {comment.replies.map((reply: any) => (
                          <div key={reply.id} className="flex space-x-3 group/reply">
                            <UserHoverCard
                              userId={reply.author.id}
                              username={reply.author.username}
                              currentUserId={dbUserId}
                            >
                              <Link href={`/profile/${reply.author.username}`}>
                                <Avatar className="w-8 h-8 flex-shrink-0 hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer ring-1 ring-gray-700">
                                  <AvatarImage src={reply.author.image ?? "/avatar.png"} />
                                </Avatar>
                              </Link>
                            </UserHoverCard>
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <UserHoverCard
                                      userId={reply.author.id}
                                      username={reply.author.username}
                                      currentUserId={dbUserId}
                                    >
                                      <Link
                                        href={`/profile/${reply.author.username}`}
                                        className="font-semibold text-sm text-white hover:text-purple-400 transition-colors"
                                      >
                                        {reply.author.name || reply.author.username}
                                      </Link>
                                    </UserHoverCard>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                      {formatDistanceToNow(new Date(reply.createdAt))} ago
                                    </span>
                                    {/* Delete button - only show for reply author */}
                                    {user && dbUserId && reply.author.id === dbUserId && (
                                      <button
                                        onClick={() => handleDeleteComment(reply.id)}
                                        disabled={deletingCommentId === reply.id}
                                        className="text-gray-500 hover:text-red-400 transition-all p-1.5 rounded-full hover:bg-gray-700 disabled:opacity-50"
                                        title="Delete reply"
                                      >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-200 break-words leading-relaxed">
                                  {reply.content.split(' ').map((word: string, idx: number) =>
                                    word.startsWith('@') ? (
                                      <span key={idx} className="text-purple-400 font-medium">{word} </span>
                                    ) : (
                                      <span key={idx}>{word} </span>
                                    )
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment Section */}
          {user ? (
            <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-800">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={user?.photoURL || "/avatar.png"} />
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
                />
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    disabled={!newComment.trim() || isCommenting}
                  >
                    {isCommenting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Posting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <SendIcon className="w-4 h-4" />
                        <span>Comment</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-6 mt-4 border-t border-gray-800">
              <Button
                onClick={() => {
                  const provider = new GoogleAuthProvider();
                  signInWithPopup(auth, provider);
                }}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-purple-500 transition-all"
              >
                <LogInIcon className="w-4 h-4" />
                <span>Sign in to comment</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default PostCard;