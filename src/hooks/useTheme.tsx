import { createContext, useContext, useEffect, useState } from "react";

const themes = ["ember", "ocean", "forest", "violet", "midnight"] as const;
export type Theme = (typeof themes)[number];

const themeLabels: Record<Theme, string> = {
  ember: "🔥 Ember",
  ocean: "🌊 Ocean",
  forest: "🌿 Forest",
  violet: "💜 Violet",
  midnight: "🌙 Midnight",
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
  label: string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("app-theme") as Theme) || "ember";
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("app-theme", t);
  };

  const cycleTheme = () => {
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, label: themeLabels[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { themes, themeLabels };
