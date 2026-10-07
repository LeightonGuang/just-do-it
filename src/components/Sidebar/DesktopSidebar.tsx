import { twMerge } from "tailwind-merge";
import { useState, useRef, useEffect } from "react";

import DoSidebar from "./DoSidebar";
import ProjectsSidebar from "./ProjectsSidebar";
import TagsSidebar from "./contexts/TagsSidebar";

const MIN_WIDTH = 150;
const MAX_WIDTH = 400;
const SNAP_THRESHOLD = 100;
const DEFAULT_WIDTH = 256;
const STORAGE_KEY = "sidebar-width";

type DesktopSidebarProps = {
  className?: string;
  onWidthChange?: (width: number) => void;
};

const DesktopSidebar = ({ className, onWidthChange }: DesktopSidebarProps) => {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const draggingRef = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);
  const draggedDistance = useRef(0);

  const updateWidth = (nextWidth: number) => {
    setWidth(nextWidth);
    onWidthChange?.(nextWidth);
  };

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

  useEffect(() => {
    if (!isHydrated) return;

    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width, isHydrated]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;

      const delta = event.clientX - startX.current;

      draggedDistance.current = Math.abs(delta);

      const rawWidth = startWidth.current + delta;

      if (rawWidth < SNAP_THRESHOLD) {
        updateWidth(0);
        return;
      }

      const nextWidth = Math.min(Math.max(rawWidth, MIN_WIDTH), MAX_WIDTH);

      updateWidth(nextWidth);
    };

    const handlePointerUp = () => {
      if (!draggingRef.current) return;

      draggingRef.current = false;
      setIsDragging(false);

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
    draggingRef.current = true;
    setIsDragging(true);

    startX.current = event.clientX;
    startWidth.current = width;
    draggedDistance.current = 0;

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    const wasClick = draggedDistance.current < 5;

    draggingRef.current = false;
    setIsDragging(false);

    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    if (!wasClick) return;

    if (width === 0) {
      updateWidth(DEFAULT_WIDTH);
      return;
    }

    updateWidth(0);
  };

  const isCollapsed = width === 0;

  return (
    <aside
      style={{
        width: `${width}px`,
        visibility: isHydrated ? "visible" : "hidden",
      }}
      className={twMerge(
        "fixed inset-y-0 left-0 z-50 shrink-0 border-r-2 border-border bg-sidebar",
        !isDragging && "transition-[width] duration-300 ease-out",
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
          <TagsSidebar />
        </div>
      </div>

      <button
        type="button"
        onPointerUp={handlePointerUp}
        onPointerDown={handlePointerDown}
        title={isCollapsed ? "Open sidebar" : ""}
        style={{
          left: isCollapsed ? "0px" : `${width}px`,
        }}
        aria-label={isCollapsed ? "Open sidebar" : "Resize sidebar"}
        className={twMerge(
          "fixed top-1/2 z-50 -translate-y-1/2",
          "touch-none",
          "cursor-grab! active:cursor-grabbing!",
          !isCollapsed && "h-dvh w-2 hover:bg-text/20",
          isCollapsed &&
            "flex h-16 w-5 items-center justify-center rounded-r-md border border-l-0 border-border bg-text/10 shadow-sm hover:bg-text/20",
        )}
      >
        {isCollapsed && (
          <div className="h-8 w-1 rounded-full bg-text/60 transition-colors" />
        )}
      </button>
    </aside>
  );
};

export default DesktopSidebar;
