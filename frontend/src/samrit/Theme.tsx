import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const storageKey = "samrit-theme";
function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}
function systemTheme(): Theme {
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
const ThemeContext = createContext({
  theme: "light" as Theme,
  toggle: () => {},
});
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<Theme | null>(savedTheme);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = preference || system;
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const changed = () => setSystem(media.matches ? "dark" : "light");
    media.addEventListener("change", changed);
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null)
        setPreference(savedTheme());
    };
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", changed);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#101c23" : "#244557");
  }, [theme]);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setPreference(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* Theme still works when storage is unavailable. */
    }
  }
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="fixed bottom-5 right-5 z-[1200] inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-samrita-charcoal shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-samrita-teal"
    >
      {theme === "dark" ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
      <span className="max-sm:sr-only">
        {theme === "dark" ? "Light theme" : "Dark theme"}
      </span>
    </button>
  );
}
