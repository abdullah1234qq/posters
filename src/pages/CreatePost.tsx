import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "@/integrations/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      toast({ title: "Posted!", description: "Your post is now live." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout showRightSidebar={false}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 shadow-card"
      >
        <h1 className="text-xl font-bold text-foreground mb-6 font-display">Create Post</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden bg-secondary">
              {file?.type.startsWith("video/") ? (
                <video src={preview} controls className="w-full max-h-96 object-cover" />
              ) : (
                <img src={preview} alt="Preview" className="w-full max-h-96 object-cover" />
              )}
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(""); }}
                className="absolute right-3 top-3 rounded-full bg-background/70 backdrop-blur-sm p-1.5 text-foreground hover:bg-background/90 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
            >
              <ImagePlus className="h-10 w-10" />
              <span className="text-sm">Upload a photo or video</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
          <Textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none bg-secondary/50 border-border/50 rounded-xl"
            rows={3}
            maxLength={500}
          />
          <Button type="submit" className="w-full rounded-xl gradient-warm text-primary-foreground border-0 h-11 font-semibold" disabled={!file || loading}>
            {loading ? "Sharing..." : "Share"}
          </Button>
        </form>
      </motion.div>
    </AppLayout>
  );
};

export default CreatePost;
