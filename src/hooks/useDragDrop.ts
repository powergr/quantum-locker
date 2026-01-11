import { useEffect, useState, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useDragDrop(onDropFiles: (paths: string[]) => void) {
  const [isDragging, setIsDragging] = useState(false);

  // Keep callback fresh
  const callbackRef = useRef(onDropFiles);
  // Keep track of drop time globally to prevent double-firing
  const lastDropTime = useRef(0);

  useEffect(() => {
    callbackRef.current = onDropFiles;
  }, [onDropFiles]);

  useEffect(() => {
    let isMounted = true;
    const unlisteners: (() => void)[] = [];

    async function setupListeners() {
      const appWindow = getCurrentWindow();

      const attach = async (event: string, handler: (e: any) => void) => {
        try {
          const unlisten = await appWindow.listen(event, handler);
          if (!isMounted) {
            unlisten();
          } else {
            unlisteners.push(unlisten);
          }
        } catch (e) {
          console.error("Failed to attach listener", e);
        }
      };

      await attach("tauri://drag-enter", () => {
        if (isMounted) setIsDragging(true);
      });

      await attach("tauri://drag-leave", () => {
        if (isMounted) setIsDragging(false);
      });

      await attach("tauri://drag-drop", (event: any) => {
        if (!isMounted) return;
        setIsDragging(false);

        // Robust Debounce using Ref
        const now = Date.now();
        if (now - lastDropTime.current < 500) {
          console.log("Duplicate drop event ignored");
          return;
        }
        lastDropTime.current = now;

        if (event.payload.paths && event.payload.paths.length > 0) {
          callbackRef.current(event.payload.paths);
        }
      });
    }

    setupListeners();

    return () => {
      isMounted = false;
      unlisteners.forEach((f) => f());
    };
  }, []);

  return { isDragging };
}
