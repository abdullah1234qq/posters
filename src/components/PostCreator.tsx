import { useState, useRef } from "react";
import { db, storage } from "@/integrations/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send } from "lucide-react";
import { motion } from "framer-motion";

interface PostCreatorProps {
  avatarUrl?: string;
  username?: string;
  onPostCreated?: () => void;
}

const PostCreator = ({ avatarUrl, username, onPostCreated }: PostCreatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file || !user) return;
    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `media/${user.uid}/${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);
      const mediaType = file.type.startsWith("video/") ? "video" : "image";

      await addDoc(collection(db, "posts"), {
        user_id: user.uid,
        media_url: publicUrl,
        media_type: mediaType,
        caption: caption.trim(),
        created_at: serverTimestamp(),
      });

      setCaption("");
      setFile(null);
      setPreview("");
      toast({ title: "Posted!", description: "Your post is now live." });
      onPostCreated?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-5 shadow-card mb-5"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
            {username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Create a Post..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none py-2"
          />
          {preview && (
            <div className="mt-3 rounded-2xl overflow-hidden bg-secondary relative">
              {file?.type.startsWith("video/") ? (
                <video src={preview} controls className="w-full max-h-48 object-cover" />
              ) : (
                <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
              )}
              <button
                onClick={() => { setFile(null); setPreview(""); }}
                className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm text-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-background/90 transition"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <Paperclip className="h-4 w-4" />
          <span>Attach</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!file || loading}
          className="flex items-center gap-2 px-5 py-2 rounded-full gradient-warm text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity"
        >
          {loading ? "Posting..." : "Post"}
          <Send className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PostCreator;
