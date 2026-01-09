import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("qre-theme") || "system"
  );

  useEffect(() => {
    if (theme === "system") {
      delete document.body.dataset.theme;
    } else {
      document.body.dataset.theme = theme;
    }
    localStorage.setItem("qre-theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
