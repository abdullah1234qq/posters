import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        if (!username.trim()) throw new Error("Username is required");
        if (username.length < 3) throw new Error("Username must be at least 3 characters");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.toLowerCase().replace(/\s/g, "_"),
              bio: bio.trim(),
            },
          },
        });
        if (error) throw error;
        toast({ title: "Account created! Check your email to verify." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate("/");
    } catch (error: any) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm glass rounded-3xl p-8 shadow-glass"
      >
        <div className="flex flex-col items-center space-y-3 mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-warm flex items-center justify-center glow-primary">
            <Camera className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Posters</h1>
          <p className="text-sm text-muted-foreground text-center">
            {isLogin ? "Welcome back. Sign in to continue." : "Create an account to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs text-muted-foreground uppercase tracking-wider">Username</Label>
                <Input id="username" type="text" placeholder="your_username" value={username} onChange={(e) => setUsername(e.target.value)} required={!isLogin} className="bg-secondary/50 border-border/50 rounded-xl focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs text-muted-foreground uppercase tracking-wider">Bio</Label>
                <Textarea id="bio" placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={150} className="resize-none bg-secondary/50 border-border/50 rounded-xl" rows={2} />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary/50 border-border/50 rounded-xl focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-secondary/50 border-border/50 rounded-xl focus:ring-primary" />
          </div>
          <Button type="submit" className="w-full rounded-xl gradient-warm text-primary-foreground border-0 h-11 font-semibold" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="relative my-6">
          <Separator className="bg-border/50" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-3 text-xs uppercase tracking-wider text-muted-foreground bg-background/0 backdrop-blur-sm">or</span>
        </div>

        <Button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          variant="outline"
          className="w-full rounded-xl h-11 font-semibold bg-secondary/50 border-border/50 hover:bg-secondary"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.6H12z" />
          </svg>
          {isLogin ? "Sign in with Google" : "Sign up with Google"}
        </Button>

        <div className="text-center mt-6">
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
