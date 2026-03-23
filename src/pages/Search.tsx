import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search as SearchIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

interface ProfileResult {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface PostResult {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  user_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

const Search = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ProfileResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setUsers([]);
      setPosts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    const [usersRes, postsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .ilike("username", `%${value.trim()}%`)
        .limit(10),
      supabase
        .from("posts")
        .select("id, media_url, media_type, caption, user_id, profiles(username, avatar_url)")
        .ilike("caption", `%${value.trim()}%`)
        .limit(12),
    ]);

    setUsers((usersRes.data as ProfileResult[]) || []);
    setPosts((postsRes.data as PostResult[]) || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-4">
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users or posts..."
            className="pl-10"
            autoFocus
          />
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          </div>
        )}

        {!loading && searched && (
          <>
            {/* Users */}
            {users.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Users</h2>
                <div className="space-y-2">
                  {users.map((u) => (
                    <Link
                      key={u.id}
                      to={u.id === user?.id ? "/profile" : `/profile/${u.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {u.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.username}</p>
                        {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            {posts.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Posts</h2>
                <div className="grid grid-cols-3 gap-0.5">
                  {posts.map((p) => (
                    <div key={p.id} className="aspect-square bg-muted relative group">
                      {p.media_type === "video" ? (
                        <video src={p.media_url} className="h-full w-full object-cover" />
                      ) : (
                        <img src={p.media_url} alt={p.caption || ""} className="h-full w-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-end p-1.5 opacity-0 group-hover:opacity-100">
                        <p className="text-[10px] text-background font-medium truncate">@{p.profiles?.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {users.length === 0 && posts.length === 0 && (
              <p className="text-center text-muted-foreground py-10 text-sm">No results found</p>
            )}
          </>
        )}

        {!searched && (
          <p className="text-center text-muted-foreground py-10 text-sm">Search for users or posts by caption</p>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Search;
