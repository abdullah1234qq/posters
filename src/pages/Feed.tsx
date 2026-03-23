import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/PostCard";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

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
    profiles: { username: string; avatar_url: string } | null;
  }[];
}

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select(`
        id, media_url, media_type, caption, created_at, user_id,
        profiles(id, username, avatar_url),
        likes(user_id),
        comments(id, text, created_at, profiles(username, avatar_url))
      `)
      .order("created_at", { ascending: false });

    setPosts((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />
      <main className="mx-auto max-w-xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">No posts yet</p>
            <p className="text-sm mt-1">Be the first to share something!</p>
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
              comments={post.comments || []}
              onLikeToggle={fetchPosts}
              onCommentAdded={fetchPosts}
            />
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Feed;
