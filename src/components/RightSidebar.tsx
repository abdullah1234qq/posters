import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/integrations/firebase/config";
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
      // Get who user follows
      const followsSnap = await getDocs(
        query(collection(db, "follows"), where("follower_id", "==", user.uid))
      );
      const followingIds = new Set(followsSnap.docs.map((d) => d.data().following_id));
      followingIds.add(user.uid);

      // Get all profiles
      const profilesSnap = await getDocs(collection(db, "profiles"));
      const allUsers: SuggestedUser[] = profilesSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((u: any) => !followingIds.has(u.id))
        .slice(0, 5);

      setSuggestions(allUsers);
    };
    fetchSuggestions();
  }, [user]);

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    const followId = `${user.uid}_${targetId}`;
    await setDoc(doc(db, "follows", followId), {
      follower_id: user.uid,
      following_id: targetId,
      created_at: serverTimestamp(),
    });
    setFollowedIds((prev) => new Set(prev).add(targetId));
  };

  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-5 shadow-card"
        >
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
                  <Button
                    size="sm"
                    onClick={() => handleFollow(u.id)}
                    className="h-7 px-3 text-xs rounded-full gradient-warm text-primary-foreground border-0 hover:opacity-90"
                  >
                    Follow
                  </Button>
                )}
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No suggestions</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-5 shadow-card"
        >
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
