import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

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
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      const mediaType = file.type.startsWith("video/") ? "video" : "image";

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
        caption: caption.trim(),
      });
      if (error) throw error;

      toast({ title: "Posted!", description: "Your post is now live." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-xl font-semibold text-foreground mb-6">Create Post</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {preview ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
              {file?.type.startsWith("video/") ? (
                <video src={preview} controls className="h-full w-full object-cover" />
              ) : (
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(""); }}
                className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground/90 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:border-foreground/30 transition-colors"
            >
              <ImagePlus className="h-12 w-12" />
              <span className="text-sm">Upload a photo or video</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none"
            rows={3}
            maxLength={500}
          />
          <Button type="submit" className="w-full" disabled={!file || loading}>
            {loading ? "Sharing..." : "Share"}
          </Button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default CreatePost;
