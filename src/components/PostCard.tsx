import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, Repeat2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

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
  isSaved?: boolean;
  isReposted?: boolean;
  repostsCount?: number;
  comments: Comment[];
  onLikeToggle: () => void;
  onCommentAdded: () => void;
}

const PostCard = ({
  id, mediaUrl, mediaType, caption, createdAt,
  author, likesCount, isLiked, isSaved = false, isReposted = false,
  repostsCount = 0, comments, onLikeToggle, onCommentAdded,
}: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);
  const [saved, setSaved] = useState(isSaved);
  const [reposted, setReposted] = useState(isReposted);
  const [reposts, setReposts] = useState(repostsCount);

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

  const handleSave = async () => {
    if (!user) return;
    const wasSaved = saved;
    setSaved(!wasSaved);
    if (wasSaved) {
      await supabase.from("saved_posts").delete().eq("post_id", id).eq("user_id", user.id);
      toast({ title: "Removed from saved" });
    } else {
      await supabase.from("saved_posts").insert({ post_id: id, user_id: user.id });
      toast({ title: "Post saved!" });
    }
  };

  const handleRepost = async () => {
    if (!user) return;
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setReposts((prev) => (wasReposted ? prev - 1 : prev + 1));
    if (wasReposted) {
      await supabase.from("reposts").delete().eq("post_id", id).eq("user_id", user.id);
      toast({ title: "Repost removed" });
    } else {
      await supabase.from("reposts").insert({ post_id: id, user_id: user.id });
      toast({ title: "Reposted!" });
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const ext = mediaType === "video" ? "mp4" : "jpg";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `post_${id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download started!" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setSubmitting(true);
    await supabase.from("comments").insert({
      user_id: user.id,
      post_id: id,
      text: commentText.trim(),
    });
    setCommentText("");
    setSubmitting(false);
    onCommentAdded();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl overflow-hidden shadow-card mb-5"
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <Link to={`/profile/${author.id}`}>
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={author.avatar_url} />
            <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
              {author.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link to={`/profile/${author.id}`} className="text-sm font-semibold text-foreground hover:opacity-70">
            {author.username}
          </Link>
          <p className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {caption && (
        <div className="px-5 pb-3">
          <p className="text-sm text-foreground/90 leading-relaxed">{caption}</p>
        </div>
      )}

      <div className="mx-4 mb-4 rounded-2xl overflow-hidden bg-secondary">
        {mediaType === "video" ? (
          <video src={mediaUrl} controls className="w-full object-cover max-h-[500px]" />
        ) : (
          <img src={mediaUrl} alt={caption} className="w-full object-cover max-h-[500px]" loading="lazy" />
        )}
      </div>

      <div className="px-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: 0.85 }} onClick={handleLike} className="flex items-center gap-1.5 transition-colors">
              <Heart className={`h-5 w-5 transition-all ${liked ? "fill-like text-like animate-heart-pop" : "text-muted-foreground hover:text-foreground"}`} />
              <span className={`text-sm font-medium ${liked ? "text-like" : "text-muted-foreground"}`}>{likes}</span>
            </motion.button>
            <label htmlFor={`comment-${id}`} className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{comments.length}</span>
            </label>
            <motion.button whileTap={{ scale: 0.85 }} onClick={handleRepost} className="flex items-center gap-1.5 transition-colors">
              <Repeat2 className={`h-5 w-5 transition-all ${reposted ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`} />
              {reposts > 0 && <span className={`text-sm font-medium ${reposted ? "text-green-500" : "text-muted-foreground"}`}>{reposts}</span>}
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={handleDownload} className="text-muted-foreground hover:text-foreground transition-colors">
              <Download className="h-5 w-5" />
            </motion.button>
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={handleSave} className="transition-colors">
            <Bookmark className={`h-5 w-5 transition-all ${saved ? "fill-primary text-primary" : "text-muted-foreground hover:text-foreground"}`} />
          </motion.button>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="px-5 pb-2 space-y-1.5">
          {comments.slice(0, 2).map((c) => (
            <p key={c.id} className="text-sm text-foreground/80">
              <span className="font-semibold text-foreground">{c.profiles?.username}</span>{" "}
              {c.text}
            </p>
          ))}
          {comments.length > 2 && (
            <p className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              View all {comments.length} comments
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleComment} className="flex items-center gap-2 px-5 py-3 border-t border-border/30">
        <Input
          id={`comment-${id}`}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50"
        />
        <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={!commentText.trim() || submitting} className="text-primary disabled:opacity-30 transition-opacity">
          <Send className="h-4 w-4" />
        </motion.button>
      </form>
    </motion.article>
  );
};

export default PostCard;
