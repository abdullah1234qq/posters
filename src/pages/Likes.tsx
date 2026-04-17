import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/PostCard";
import AppLayout from "@/components/AppLayout";
import { Heart } from "lucide-react";

interface Post {
  id: string;
  media_url: string;
  media_type: string;
  caption: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; avatar_url: string; id: string } | null;
  likes: { user_id: string }[];
  comments: {
    id: string;
    text: string;
    created_at: string;
    user_id: string;
    profiles: { username: string; avatar_url: string } | null;
  }[];
  reposts: { user_id: string }[];
}

const Likes = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchLikedPosts = async () => {
    if (!user) return;
    try {
      const { data: likesData } = await supabase
        .from("likes")
        .select("post_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const ids = (likesData || []).map((l) => l.post_id);
      if (ids.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data: postsData, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id(id, username, avatar_url),
          likes(user_id),
          comments(id, text, created_at, user_id, profiles:user_id(username, avatar_url)),
          reposts(user_id)
        `)
        .in("id", ids);

      if (error) throw error;

      const byId = new Map((postsData || []).map((p: any) => [p.id, p]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

      const formatted = ordered.map((p: any) => ({
        ...p,
        profiles: p.profiles ? { id: p.profiles.id, username: p.profiles.username, avatar_url: p.profiles.avatar_url } : null,
        comments: (p.comments || []).map((c: any) => ({
          ...c,
          profiles: c.profiles ? { username: c.profiles.username, avatar_url: c.profiles.avatar_url } : null,
        })),
      }));

      setPosts(formatted);

      const { data: saved } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id);
      setSavedPostIds(new Set((saved || []).map((s) => s.post_id)));
    } catch (error) {
      console.error("Error fetching liked posts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLikedPosts();
  }, [user]);

  return (
    <AppLayout>
      <div className="glass rounded-3xl p-5 mb-4 shadow-card flex items-center gap-3">
        <Heart className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground font-display">Your Likes</h1>
      </div>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass rounded-3xl py-16 text-center shadow-card">
          <p className="text-lg text-foreground">No liked posts yet</p>
          <p className="text-sm mt-1 text-muted-foreground">Posts you like will appear here</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            mediaUrl={post.media_url}
            mediaType={post.media_type}
            caption={post.caption || ""}
            createdAt={post.created_at}
            author={{
              username: post.profiles?.username || "unknown",
              avatar_url: post.profiles?.avatar_url || "",
              id: post.profiles?.id || post.user_id,
            }}
            likesCount={post.likes?.length || 0}
            isLiked={post.likes?.some((l) => l.user_id === user?.id) || false}
            isSaved={savedPostIds.has(post.id)}
            isReposted={post.reposts?.some((r) => r.user_id === user?.id) || false}
            repostsCount={post.reposts?.length || 0}
            comments={post.comments || []}
            onLikeToggle={fetchLikedPosts}
            onCommentAdded={fetchLikedPosts}
          />
        ))
      )}
    </AppLayout>
  );
};

export default Likes;
