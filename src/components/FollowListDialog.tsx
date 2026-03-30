import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FollowUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
}

const FollowListDialog = ({ open, onOpenChange, userId, type }: FollowListDialogProps) => {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      setLoading(true);
      const field = type === "followers" ? "following_id" : "follower_id";
      const targetField = type === "followers" ? "follower_id" : "following_id";

      const { data: follows } = await supabase
        .from("follows")
        .select("*")
        .eq(field, userId);

      const ids = (follows || []).map((f: any) => f[targetField]);
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", ids);
        setUsers(profiles || []);
      } else {
        setUsers([]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [open, userId, type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/30 rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display capitalize">{type}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No {type} yet</p>
          ) : (
            <div className="space-y-1">
              {users.map((u) => (
                <Link key={u.id} to={`/profile/${u.id}`} onClick={() => onOpenChange(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-secondary/50 transition-colors">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-muted-foreground text-xs">{u.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{u.username}</span>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FollowListDialog;
