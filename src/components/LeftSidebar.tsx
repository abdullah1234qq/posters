import { Link, useLocation } from "react-router-dom";
import { Home, Search, PlusSquare, Heart, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const LeftSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/create", icon: PlusSquare, label: "Create" },
    { to: "/likes", icon: Heart, label: "Likes" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-1 glass-strong rounded-3xl p-3 shadow-glass">
      {items.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to} aria-label={label}>
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                active
                  ? "gradient-warm text-primary-foreground glow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          </Link>
        );
      })}
      <div className="w-6 border-t border-border my-2" />
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={signOut}
        className="flex items-center justify-center w-11 h-11 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        aria-label="Logout"
      >
        <LogOut className="h-5 w-5" />
      </motion.button>
    </aside>
  );
};

export default LeftSidebar;
