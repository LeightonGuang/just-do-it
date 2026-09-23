import { twMerge } from "tailwind-merge";
import { useState, useRef, useEffect } from "react";

import DoSidebar from "./DoSidebar";
import ProjectsSidebar from "./ProjectsSidebar";

const MIN_WIDTH = 150;
const MAX_WIDTH = 300;
const SNAP_THRESHOLD = 100;
const DEFAULT_WIDTH = 256;
const STORAGE_KEY = "sidebar-width";

type SidebarProps = {
  className?: string;
  onWidthChange?: (width: number) => void;
};

const Sidebar = ({ className, onWidthChange }: SidebarProps) => {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isHydrated, setIsHydrated] = useState(false);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const updateWidth = (nextWidth: number) => {
    setWidth(nextWidth);
    onWidthChange?.(nextWidth);
  };

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEY);

    if (savedWidth !== null) {
      const parsedWidth = Number(savedWidth);

      if (!Number.isNaN(parsedWidth)) {
        updateWidth(parsedWidth);
        startWidth.current = parsedWidth;
      }
    }

    setIsHydrated(true);
  }, []);

  // Save width whenever it changes
  useEffect(() => {
    if (!isHydrated) return;

    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width, isHydrated]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging.current) return;

      const delta = event.clientX - startX.current;
      const rawWidth = startWidth.current + delta;

      // Currently collapsed
      if (startWidth.current === 0) {
        if (delta < SNAP_THRESHOLD) {
          updateWidth(0);
          return;
        }

        updateWidth(MIN_WIDTH);

        startX.current = event.clientX;
        startWidth.current = MIN_WIDTH;

        return;
      }

      /**
       * Dragging closed.
       */
      if (rawWidth < SNAP_THRESHOLD) {
        updateWidth(0);

        startX.current = event.clientX;
        startWidth.current = 0;

        return;
      }

      /**
       * Normal resizing.
       */
      const nextWidth = Math.min(Math.max(rawWidth, MIN_WIDTH), MAX_WIDTH);

      updateWidth(nextWidth);
    };

    const handlePointerUp = () => {
      isDragging.current = false;

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent) => {
    isDragging.current = true;

    startX.current = event.clientX;
    startWidth.current = width;

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  };

  const isCollapsed = width === 0;

  return (
    <aside
      style={{
        width: `${width}px`,
        visibility: isHydrated ? "visible" : "hidden",
      }}
      className={twMerge(
        "fixed inset-y-0 left-0 z-50 shrink-0 border-r border-border bg-sidebar",
        className,
      )}
    >
      <div
        className={twMerge(
          "h-full overflow-hidden",
          isCollapsed && "pointer-events-none invisible",
        )}
      >
        <h1 className="p-2 text-lg font-medium whitespace-nowrap text-orange-500 uppercase">
          <a href="/" className="hover:underline">
            Just Do it
          </a>
        </h1>

        <div className="flex flex-col">
          <DoSidebar />
          <ProjectsSidebar />
        </div>
      </div>

      {/* Drag handle */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          left: isCollapsed ? "0px" : `${width}px`,
        }}
        className={twMerge(
          "fixed top-1/2 z-50 -translate-y-1/2 hover:cursor-grab active:cursor-grabbing",

          !isCollapsed && "h-dvh w-2 hover:bg-text/20",

          isCollapsed && [
            "flex h-16 w-5 items-center justify-center",
            "rounded-r-md",
            "border border-l-0 border-border",
            "bg-text/10",
            "shadow-sm",
            "hover:bg-text/20",
          ],
        )}
      >
        {isCollapsed && <div className="h-8 w-1 rounded-full bg-text/60" />}
      </div>
    </aside>
  );
};

export default Sidebar;
