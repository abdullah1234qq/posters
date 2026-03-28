import { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/config";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
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
    try {
      const postsQuery = query(collection(db, "posts"), orderBy("created_at", "desc"));
      const postsSnap = await getDocs(postsQuery);

      const postsData: Post[] = await Promise.all(
        postsSnap.docs.map(async (postDoc) => {
          const data = postDoc.data();
          const postId = postDoc.id;

          // Fetch profile
          let profileData = null;
          if (data.user_id) {
            const profileSnap = await getDoc(doc(db, "profiles", data.user_id));
            if (profileSnap.exists()) {
              profileData = { id: data.user_id, ...profileSnap.data() } as any;
            }
          }

          // Fetch likes
          const likesSnap = await getDocs(collection(db, "posts", postId, "likes"));
          const likes = likesSnap.docs.map((d) => ({ user_id: d.data().user_id }));

          // Fetch comments
          const commentsQuery = query(collection(db, "posts", postId, "comments"), orderBy("created_at", "asc"));
          const commentsSnap = await getDocs(commentsQuery);
          const comments = await Promise.all(
            commentsSnap.docs.map(async (c) => {
              const cData = c.data();
              let commentProfile = null;
              if (cData.user_id) {
                const pSnap = await getDoc(doc(db, "profiles", cData.user_id));
                if (pSnap.exists()) commentProfile = pSnap.data() as any;
              }
              return {
                id: c.id,
                text: cData.text,
                created_at: cData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
                profiles: commentProfile ? { username: commentProfile.username, avatar_url: commentProfile.avatar_url } : null,
              };
            })
          );

          // Fetch reposts
          const repostsSnap = await getDocs(collection(db, "posts", postId, "reposts"));
          const reposts = repostsSnap.docs.map((d) => ({ user_id: d.data().user_id }));

          return {
            id: postId,
            media_url: data.media_url,
            media_type: data.media_type || "image",
            caption: data.caption || "",
            created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            user_id: data.user_id,
            profiles: profileData ? { username: profileData.username, avatar_url: profileData.avatar_url, id: profileData.id } : null,
            likes,
            comments,
            reposts,
          };
        })
      );

      setPosts(postsData);

      // Fetch saved posts
      if (user) {
        const savedSnap = await getDocs(collection(db, "users", user.uid, "saved_posts"));
        setSavedPostIds(new Set(savedSnap.docs.map((d) => d.data().post_id)));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    if (user) {
      getDoc(doc(db, "profiles", user.uid)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfile({ username: data.username, avatar_url: data.avatar_url });
        }
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
            isLiked={post.likes?.some((l) => l.user_id === user?.uid) || false}
            isSaved={savedPostIds.has(post.id)}
            isReposted={post.reposts?.some((r) => r.user_id === user?.uid) || false}
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
