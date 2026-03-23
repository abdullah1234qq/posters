import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

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

  const fetchProfile = async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetId)
      .single();
    if (data) {
      setProfile(data);
      setBio(data.bio || "");
      setUsername(data.username || "");
    }

    const { data: postsData } = await supabase
      .from("posts")
      .select("id, media_url, media_type, caption")
      .eq("user_id", targetId)
      .order("created_at", { ascending: false });
    setPosts(postsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [targetId]);

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
    const { error } = await supabase
      .from("profiles")
      .update({ bio, username })
      .eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEditing(false);
      fetchProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-6">
        {/* Profile header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                {profile?.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow"
                >
                  <Camera className="h-3 w-3" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </>
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                />
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Bio"
                  rows={2}
                  maxLength={150}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-foreground">{profile?.username}</h2>
                <p className="text-sm text-muted-foreground mt-1">{profile?.bio || "No bio yet"}</p>
                <p className="text-sm text-foreground mt-2 font-medium">{posts.length} posts</p>
                {isOwnProfile && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Post grid */}
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post) => (
            <div key={post.id} className="aspect-square bg-muted">
              {post.media_type === "video" ? (
                <video src={post.media_url} className="h-full w-full object-cover" />
              ) : (
                <img src={post.media_url} alt={post.caption} className="h-full w-full object-cover" loading="lazy" />
              )}
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-10 text-sm">No posts yet</p>
        )}
      </main>
    </div>
  );
};

export default Profile;
