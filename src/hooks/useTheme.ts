import { useEffect, useState } from "react";

import type { Theme } from "../types/Theme";

export const useTheme = (): Theme => {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    setTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");
    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
};
