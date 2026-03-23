import { Link } from "react-router-dom";
import { Camera, Palette } from "lucide-react";
import { useTheme, themes, themeLabels } from "@/hooks/useTheme";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { theme, setTheme, label } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 lg:pl-24">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-warm flex items-center justify-center glow-sm">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground font-display tracking-tight">Snapgram</span>
        </Link>

        {/* Theme Switcher */}
        <div className="relative" ref={menuRef}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl glass hover:bg-secondary/50 transition-colors"
            aria-label="Change theme"
          >
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">{label}</span>
          </motion.button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 glass-strong rounded-2xl p-2 shadow-glass min-w-[160px] z-50"
              >
                {themes.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setOpen(false); }}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors ${
                      theme === t
                        ? "gradient-warm text-primary-foreground font-medium"
                        : "text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {themeLabels[t]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
