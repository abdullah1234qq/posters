import { Link } from "react-router-dom";
import { Camera } from "lucide-react";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4 lg:pl-24">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-warm flex items-center justify-center glow-sm">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground font-display tracking-tight">Snapgram</span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
