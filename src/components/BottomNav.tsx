import { Link, useLocation } from "react-router-dom";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();

  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/create", icon: PlusSquare, label: "Create" },
    { to: "/likes", icon: Heart, label: "Likes" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong lg:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {items.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-2xl transition-all duration-200 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={label}
            >
              <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_hsl(30,80%,55%)]" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
