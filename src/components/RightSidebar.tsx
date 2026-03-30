import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SuggestedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

const RightSidebar = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetchSuggestions = async () => {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followingIds = new Set((follows || []).map((f) => f.following_id));
      followingIds.add(user.id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .limit(20);

      const filtered = (profiles || [])
        .filter((p) => !followingIds.has(p.id))
        .slice(0, 5);

      setSuggestions(filtered);
    };
    fetchSuggestions();
  }, [user]);

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
    setFollowedIds((prev) => new Set(prev).add(targetId));
  };

  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Suggested for you</h3>
          </div>
          <div className="space-y-3">
            {suggestions.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Link to={`/profile/${u.id}`}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                      {u.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.id}`} className="text-sm font-medium text-foreground hover:opacity-80 truncate block">
                    {u.username}
                  </Link>
                  {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
                </div>
                {followedIds.has(u.id) ? (
                  <span className="text-xs text-muted-foreground">Following</span>
                ) : (
                  <Button size="sm" onClick={() => handleFollow(u.id)} className="h-7 px-3 text-xs rounded-full gradient-warm text-primary-foreground border-0 hover:opacity-90">
                    Follow
                  </Button>
                )}
              </div>
            ))}
            {suggestions.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No suggestions</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-3xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">🔥 Trending Today</h3>
          <div className="space-y-3">
            {["Photography", "Travel", "Design", "Nature"].map((topic) => (
              <div key={topic} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors cursor-default">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm">
                  {topic === "Photography" ? "📸" : topic === "Travel" ? "✈️" : topic === "Design" ? "🎨" : "🌿"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{topic}</p>
                  <p className="text-xs text-muted-foreground">Trending now</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </aside>
  );
};

export default RightSidebar;
