import { Link } from "react-router-dom";
import { Camera, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-foreground" />
          <span className="text-lg font-semibold text-foreground">Snapgram</span>
        </Link>
        <button
          onClick={signOut}
          className="rounded-lg p-2.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
