import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/PostCard";
import PostCreator from "@/components/PostCreator";
import AppLayout from "@/components/AppLayout";

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
  reposts: { user_id: string }[];
}

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string } | null>(null);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select(`
        id, media_url, media_type, caption, created_at, user_id,
        profiles(id, username, avatar_url),
        likes(user_id),
        comments(id, text, created_at, profiles(username, avatar_url)),
        reposts(user_id)
      `)
      .order("created_at", { ascending: false });

    setPosts((data as any) || []);

    // Fetch saved posts for current user
    if (user) {
      const { data: saved } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id);
      setSavedPostIds(new Set((saved || []).map((s: any) => s.post_id)));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    if (user) {
      supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single().then(({ data }) => {
        if (data) setProfile(data);
      });
    }
  }, [user]);

  return (
    <AppLayout>
      <PostCreator
        avatarUrl={profile?.avatar_url}
        username={profile?.username}
        onPostCreated={fetchPosts}
      />
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass rounded-3xl py-16 text-center shadow-card">
          <p className="text-lg text-foreground">No posts yet</p>
          <p className="text-sm mt-1 text-muted-foreground">Be the first to share something!</p>
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
            onLikeToggle={fetchPosts}
            onCommentAdded={fetchPosts}
          />
        ))
      )}
    </AppLayout>
  );
};

export default Feed;
