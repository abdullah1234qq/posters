import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, Repeat2, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Comment {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; avatar_url: string } | null;
}

interface PostDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrl: string;
  mediaType: string;
  caption: string;
  createdAt: string;
  author: { username: string; avatar_url: string; id: string };
  likes: number;
  liked: boolean;
  saved: boolean;
  reposted: boolean;
  reposts: number;
  comments: Comment[];
  commentText: string;
  submitting: boolean;
  onCommentTextChange: (text: string) => void;
  onComment: (e: React.FormEvent) => void;
  onLike: () => void;
  onSave: () => void;
  onRepost: () => void;
  onDownload: () => void;
  onDeleteComment: (commentId: string) => void;
}

const PostDetailDialog = ({
  open, onOpenChange, mediaUrl, mediaType, caption, createdAt,
  author, likes, liked, saved, reposted, reposts, comments,
  commentText, submitting, onCommentTextChange, onComment,
  onLike, onSave, onRepost, onDownload, onDeleteComment,
}: PostDetailDialogProps) => {
  const { user } = useAuth();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden rounded-2xl border-border/50 bg-background max-h-[90vh]">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Media side */}
          <div className="md:w-[60%] bg-secondary flex items-center justify-center min-h-[250px] md:min-h-[500px]">
            {mediaType === "video" ? (
              <video src={mediaUrl} controls className="w-full h-full object-contain max-h-[90vh]" />
            ) : (
              <img src={mediaUrl} alt={caption} className="w-full h-full object-contain max-h-[90vh]" />
            )}
          </div>

          {/* Details side */}
          <div className="md:w-[40%] flex flex-col border-l border-border/30">
            {/* Author header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
              <Link to={`/profile/${author.id}`} onClick={() => onOpenChange(false)}>
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarImage src={author.avatar_url} />
                  <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                    {author.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link to={`/profile/${author.id}`} onClick={() => onOpenChange(false)} className="text-sm font-semibold text-foreground hover:opacity-70">
                  {author.username}
                </Link>
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Caption + Comments */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 py-3 space-y-3">
                {caption && (
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    <span className="font-semibold text-foreground">{author.username}</span>{" "}
                    {caption}
                  </p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                      <AvatarImage src={c.profiles?.avatar_url} />
                      <AvatarFallback className="bg-secondary text-muted-foreground text-[10px]">
                        {c.profiles?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-foreground/80">
                        <span className="font-semibold text-foreground">{c.profiles?.username}</span>{" "}
                        {c.text}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="px-4 py-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.button whileTap={{ scale: 0.85 }} onClick={onLike} className="flex items-center gap-1.5">
                    <Heart className={`h-5 w-5 transition-all ${liked ? "fill-like text-like" : "text-muted-foreground hover:text-foreground"}`} />
                    <span className={`text-sm font-medium ${liked ? "text-like" : "text-muted-foreground"}`}>{likes}</span>
                  </motion.button>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{comments.length}</span>
                  </div>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={onRepost} className="flex items-center gap-1.5">
                    <Repeat2 className={`h-5 w-5 transition-all ${reposted ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`} />
                    {reposts > 0 && <span className={`text-sm font-medium ${reposted ? "text-green-500" : "text-muted-foreground"}`}>{reposts}</span>}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={onDownload} className="text-muted-foreground hover:text-foreground">
                    <Download className="h-5 w-5" />
                  </motion.button>
                </div>
                <motion.button whileTap={{ scale: 0.85 }} onClick={onSave}>
                  <Bookmark className={`h-5 w-5 transition-all ${saved ? "fill-primary text-primary" : "text-muted-foreground hover:text-foreground"}`} />
                </motion.button>
              </div>
            </div>

            {/* Comment input */}
            <form onSubmit={onComment} className="flex items-center gap-2 px-4 py-3 border-t border-border/30">
              <Input
                value={commentText}
                onChange={(e) => onCommentTextChange(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50"
              />
              <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={!commentText.trim() || submitting} className="text-primary disabled:opacity-30 transition-opacity">
                <Send className="h-4 w-4" />
              </motion.button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDetailDialog;
