import { useEffect, useState, useRef } from "react";
import FollowListDialog from "@/components/FollowListDialog";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

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
  const targetId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
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

  const fetchProfile = async () => {
    if (!targetId) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", targetId).single();
    if (data) {
      setProfile(data);
      setBio(data.bio || "");
      setUsername(data.username || "");
    }

    const { data: postsData } = await supabase
      .from("posts").select("id, media_url, media_type, caption")
      .eq("user_id", targetId).order("created_at", { ascending: false });
    setPosts(postsData || []);

    const { count: followers } = await supabase
      .from("follows").select("*", { count: "exact", head: true }).eq("following_id", targetId);
    setFollowersCount(followers || 0);

    const { count: following } = await supabase
      .from("follows").select("*", { count: "exact", head: true }).eq("follower_id", targetId);
    setFollowingCount(following || 0);

    if (user && targetId !== user.id) {
      const { data: followData } = await supabase
        .from("follows").select("id").eq("follower_id", user.id).eq("following_id", targetId).maybeSingle();
      setIsFollowing(!!followData);
    }

    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [targetId, user]);

  const handleFollow = async () => {
    if (!user || !targetId) return;
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
    }
    setIsFollowing(!isFollowing);
    setFollowersCount((c) => (isFollowing ? c - 1 : c + 1));
    setFollowLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from("media").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    fetchProfile();
  };

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ bio, username }).eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEditing(false);
      fetchProfile();
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
                  <button
                    onClick={() => { setFollowDialogType("followers"); setFollowDialogOpen(true); }}
                    className="text-center hover:opacity-70 transition-opacity"
                  >
                    <p className="text-lg font-bold text-foreground">{followersCount}</p>
                    <p className="text-xs text-muted-foreground">followers</p>
                  </button>
                  <button
                    onClick={() => { setFollowDialogType("following"); setFollowDialogOpen(true); }}
                    className="text-center hover:opacity-70 transition-opacity"
                  >
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

      {/* Post grid */}
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="aspect-square bg-secondary group relative cursor-pointer"
          >
            {post.media_type === "video" ? (
              <video src={post.media_url} className="h-full w-full object-cover" />
            ) : (
              <img src={post.media_url} alt={post.caption} className="h-full w-full object-cover" loading="lazy" />
            )}
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors" />
          </motion.div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="glass rounded-3xl py-16 text-center shadow-card">
          <p className="text-muted-foreground text-sm">No posts yet</p>
        </div>
      )}

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
