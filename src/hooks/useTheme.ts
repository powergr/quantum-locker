import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("qre-theme") || "system"
  );

  useEffect(() => {
    const updateTheme = async () => {
      const appWindow = getCurrentWindow();

      if (theme === "system") {
        delete document.body.dataset.theme;
        // Reset to system default (null lets OS decide)
        await appWindow.setTheme(null);
      } else {
        document.body.dataset.theme = theme;
        // Force the OS Title Bar to match ("light" or "dark")
        await appWindow.setTheme(theme as "light" | "dark");
      }
    };

    updateTheme();
    localStorage.setItem("qre-theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
