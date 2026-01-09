"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("deepguard-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = stored ? stored === "dark" : prefersDark;
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const nextValue = !isDark;
    setIsDark(nextValue);
    document.documentElement.classList.toggle("dark", nextValue);
    window.localStorage.setItem("deepguard-theme", nextValue ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="h-10 w-10 flex items-center justify-center rounded-full bg-white/70 dark:bg-white/10 border border-white/20 hover:scale-105 transition"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
