import { Link, useLocation } from "react-router-dom";
import { Home, PlusSquare, User, LogOut, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/create", icon: PlusSquare, label: "Create" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-foreground" />
          <span className="text-lg font-semibold text-foreground hidden sm:inline">Snapgram</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`rounded-lg p-2.5 transition-colors ${
                location.pathname === to
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
            </Link>
          ))}
          <button
            onClick={signOut}
            className="rounded-lg p-2.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
