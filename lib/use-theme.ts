"use client";

import { useEffect, useState } from "react";

function applyTheme(dark: boolean) {
  const html = document.documentElement;
  html.setAttribute("data-theme", dark ? "dark" : "light");
  html.classList.toggle("dark", dark);
}

export function useTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("novae-theme");
    const dark = saved !== "light";
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("novae-theme", next ? "dark" : "light");
    applyTheme(next);
  }

  return { isDark, toggle };
}
