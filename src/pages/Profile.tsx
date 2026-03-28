import { useEffect, useState, useRef } from "react";
import FollowListDialog from "@/components/FollowListDialog";
import { useParams } from "react-router-dom";
import { db, storage } from "@/integrations/firebase/config";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Grid3X3, Repeat2 } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Profile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
}

interface Post {
  id: string;
  media_url: string;
  media_type: string;
  caption: string;
}

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const targetId = userId || user?.uid;
  const isOwnProfile = !userId || userId === user?.uid;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reposts, setReposts] = useState<Post[]>([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followDialogType, setFollowDialogType] = useState<"followers" | "following">("followers");
  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const fetchProfile = async () => {
    if (!targetId) return;

    // Profile
    const profileSnap = await getDoc(doc(db, "profiles", targetId));
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      const p = { id: targetId, username: data.username, bio: data.bio || "", avatar_url: data.avatar_url || "" };
      setProfile(p);
      setBio(p.bio);
      setUsername(p.username);
    }

    // Posts
    const postsQuery = query(collection(db, "posts"), where("user_id", "==", targetId), orderBy("created_at", "desc"));
    const postsSnap = await getDocs(postsQuery);
    setPosts(postsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any)));

    // Reposts - from user's reposts subcollection
    const repostsSnap = await getDocs(collection(db, "users", targetId, "reposts"));
    const repostPosts: Post[] = [];
    for (const rDoc of repostsSnap.docs) {
      const postId = rDoc.data().post_id;
      const postSnap = await getDoc(doc(db, "posts", postId));
      if (postSnap.exists()) {
        repostPosts.push({ id: postSnap.id, ...postSnap.data() } as any);
      }
    }
    setReposts(repostPosts);

    // Followers count
    const followersSnap = await getDocs(query(collection(db, "follows"), where("following_id", "==", targetId)));
    setFollowersCount(followersSnap.size);

    // Following count
    const followingSnap = await getDocs(query(collection(db, "follows"), where("follower_id", "==", targetId)));
    setFollowingCount(followingSnap.size);

    // Is following
    if (user && targetId !== user.uid) {
      const followQuery = query(
        collection(db, "follows"),
        where("follower_id", "==", user.uid),
        where("following_id", "==", targetId)
      );
      const followSnap = await getDocs(followQuery);
      setIsFollowing(!followSnap.empty);
    }

    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [targetId, user]);

  const handleFollow = async () => {
    if (!user || !targetId) return;
    setFollowLoading(true);
    const followId = `${user.uid}_${targetId}`;
    const followRef = doc(db, "follows", followId);
    if (isFollowing) {
      await deleteDoc(followRef);
    } else {
      await setDoc(followRef, { follower_id: user.uid, following_id: targetId, created_at: serverTimestamp() });
    }
    setIsFollowing(!isFollowing);
    setFollowersCount((c) => (isFollowing ? c - 1 : c + 1));
    setFollowLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.uid}/avatar.${ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const publicUrl = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "profiles", user.uid), { avatar_url: publicUrl, updated_at: serverTimestamp() });
    fetchProfile();
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "profiles", user.uid), { bio, username, updated_at: serverTimestamp() });
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AppLayout showRightSidebar={false}>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showRightSidebar={false}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 shadow-card mb-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-secondary text-muted-foreground text-xl">
                {profile?.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full gradient-warm p-1.5 text-primary-foreground shadow glow-sm"
                >
                  <Camera className="h-3 w-3" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </>
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="bg-secondary/50 border-border/50 rounded-xl" />
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" rows={2} maxLength={150} className="bg-secondary/50 border-border/50 rounded-xl resize-none" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="rounded-xl gradient-warm text-primary-foreground border-0">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-foreground font-display">{profile?.username}</h2>
                <div className="flex gap-5 mt-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{posts.length}</p>
                    <p className="text-xs text-muted-foreground">posts</p>
                  </div>
                  <button onClick={() => { setFollowDialogType("followers"); setFollowDialogOpen(true); }} className="text-center hover:opacity-70 transition-opacity">
                    <p className="text-lg font-bold text-foreground">{followersCount}</p>
                    <p className="text-xs text-muted-foreground">followers</p>
                  </button>
                  <button onClick={() => { setFollowDialogType("following"); setFollowDialogOpen(true); }} className="text-center hover:opacity-70 transition-opacity">
                    <p className="text-lg font-bold text-foreground">{followingCount}</p>
                    <p className="text-xs text-muted-foreground">following</p>
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{profile?.bio || "No bio yet"}</p>
                {isOwnProfile ? (
                  <Button size="sm" variant="outline" className="mt-3 rounded-xl border-border/50" onClick={() => setEditing(true)}>
                    Edit Profile
                  </Button>
                ) : user ? (
                  <Button
                    size="sm"
                    className={`mt-3 rounded-xl border-0 ${isFollowing ? "bg-secondary text-foreground" : "gradient-warm text-primary-foreground"}`}
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full glass rounded-2xl mb-4">
          <TabsTrigger value="posts" className="flex-1 gap-2 rounded-xl">
            <Grid3X3 className="h-4 w-4" /> Posts
          </TabsTrigger>
          <TabsTrigger value="reposts" className="flex-1 gap-2 rounded-xl">
            <Repeat2 className="h-4 w-4" /> Reposts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {posts.length === 0 ? (
            <div className="glass rounded-3xl py-16 text-center shadow-card">
              <p className="text-muted-foreground text-sm">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
              {posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedPost(post)} className="aspect-square bg-secondary group relative cursor-pointer">
                  {post.media_type === "video" ? (
                    <video src={post.media_url} className="h-full w-full object-cover" />
                  ) : (
                    <img src={post.media_url} alt={post.caption} className="h-full w-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors" />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reposts">
          {reposts.length === 0 ? (
            <div className="glass rounded-3xl py-16 text-center shadow-card">
              <p className="text-muted-foreground text-sm">No reposts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
              {reposts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedPost(post)} className="aspect-square bg-secondary group relative cursor-pointer">
                  {post.media_type === "video" ? (
                    <video src={post.media_url} className="h-full w-full object-cover" />
                  ) : (
                    <img src={post.media_url} alt={post.caption} className="h-full w-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors" />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-border/30 bg-background">
          {selectedPost && (
            <div>
              <div className="bg-secondary">
                {selectedPost.media_type === "video" ? (
                  <video src={selectedPost.media_url} controls autoPlay className="w-full max-h-[70vh] object-contain" />
                ) : (
                  <img src={selectedPost.media_url} alt={selectedPost.caption} className="w-full max-h-[70vh] object-contain" />
                )}
              </div>
              {selectedPost.caption && (
                <div className="p-5">
                  <p className="text-sm text-foreground/90 leading-relaxed">{selectedPost.caption}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {targetId && (
        <FollowListDialog
          open={followDialogOpen}
          onOpenChange={setFollowDialogOpen}
          userId={targetId}
          type={followDialogType}
        />
      )}
    </AppLayout>
  );
};

export default Profile;
