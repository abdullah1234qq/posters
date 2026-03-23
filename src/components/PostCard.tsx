import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Comment {
  id: string;
  text: string;
  created_at: string;
  profiles: { username: string; avatar_url: string } | null;
}

interface PostCardProps {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string;
  createdAt: string;
  author: { username: string; avatar_url: string; id: string };
  likesCount: number;
  isLiked: boolean;
  comments: Comment[];
  onLikeToggle: () => void;
  onCommentAdded: () => void;
}

const PostCard = ({
  id, mediaUrl, mediaType, caption, createdAt,
  author, likesCount, isLiked, comments, onLikeToggle, onCommentAdded,
}: PostCardProps) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);

  const handleLike = async () => {
    if (!user) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((prev) => (wasLiked ? prev - 1 : prev + 1));

    if (wasLiked) {
      await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ post_id: id, user_id: user.id });
    }
    onLikeToggle();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setSubmitting(true);
    await supabase.from("comments").insert({
      post_id: id,
      user_id: user.id,
      text: commentText.trim(),
    });
    setCommentText("");
    setSubmitting(false);
    onCommentAdded();
  };

  return (
    <article className="border-b border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/profile/${author.id}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={author.avatar_url} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {author.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Link to={`/profile/${author.id}`} className="text-sm font-semibold text-foreground hover:opacity-70">
          {author.username}
        </Link>
      </div>

      {/* Media */}
      <div className="aspect-square w-full bg-muted">
        {mediaType === "video" ? (
          <video src={mediaUrl} controls className="h-full w-full object-cover" />
        ) : (
          <img src={mediaUrl} alt={caption} className="h-full w-full object-cover" loading="lazy" />
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="transition-transform active:scale-90">
            <Heart
              className={`h-6 w-6 transition-colors ${
                liked ? "fill-like text-like animate-heart-pop" : "text-foreground"
              }`}
            />
          </button>
          <label htmlFor={`comment-${id}`} className="cursor-pointer">
            <MessageCircle className="h-6 w-6 text-foreground" />
          </label>
        </div>

        {/* Likes count */}
        <p className="mt-2 text-sm font-semibold text-foreground">
          {likes} {likes === 1 ? "like" : "likes"}
        </p>

        {/* Caption */}
        {caption && (
          <p className="mt-1 text-sm text-foreground">
            <span className="font-semibold">{author.username}</span>{" "}
            {caption}
          </p>
        )}

        {/* Comments */}
        {comments.length > 0 && (
          <div className="mt-2 space-y-1">
            {comments.slice(0, 3).map((c) => (
              <p key={c.id} className="text-sm text-foreground">
                <span className="font-semibold">{c.profiles?.username}</span>{" "}
                {c.text}
              </p>
            ))}
            {comments.length > 3 && (
              <p className="text-xs text-muted-foreground">
                View all {comments.length} comments
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className="mt-1 text-[10px] uppercase text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Comment input */}
      <form onSubmit={handleComment} className="flex items-center border-t border-border px-4 py-2 mt-2">
        <Input
          id={`comment-${id}`}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 px-0"
        />
        <button
          type="submit"
          disabled={!commentText.trim() || submitting}
          className="text-sm font-semibold text-primary disabled:opacity-30 ml-2"
        >
          Post
        </button>
      </form>
    </article>
  );
};

export default PostCard;
