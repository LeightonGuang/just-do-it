import { twMerge } from "tailwind-merge";
import { useState, useRef, useEffect } from "react";

import TodoSidebar from "./TodoSidebar";
import ProjectsSidebar from "./ProjectsSidebar";

const MIN_WIDTH = 150;
const MAX_WIDTH = 300;
const SNAP_THRESHOLD = 100;

const Sidebar = ({ className }: { className?: string }) => {
  const [width, setWidth] = useState(256);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(256);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging.current) return;

      const delta = event.clientX - startX.current;
      const rawWidth = startWidth.current + delta;

      // Currently collapsed
      if (startWidth.current === 0) {
        if (delta < SNAP_THRESHOLD) {
          setWidth(0);
          return;
        }

        setWidth(MIN_WIDTH);

        startX.current = event.clientX;
        startWidth.current = MIN_WIDTH;

        return;
      }

      // Dragging closed
      if (rawWidth < SNAP_THRESHOLD) {
        setWidth(0);

        startX.current = event.clientX;
        startWidth.current = 0;

        return;
      }

      // Normal resizing
      setWidth(Math.min(Math.max(rawWidth, MIN_WIDTH), MAX_WIDTH));
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
      style={{ width: `${width}px` }}
      className={twMerge(
        "relative h-dvh shrink-0 border-r border-border bg-sidebar",
        className,
      )}
    >
      <div
        className={twMerge(
          "h-full overflow-hidden",
          isCollapsed && "pointer-events-none invisible",
        )}
      >
        <h1 className="p-2 text-lg font-medium whitespace-nowrap uppercase">
          Just Do it
        </h1>

        <div className="flex flex-col">
          <TodoSidebar />
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

          !isCollapsed && "hover:bg-retro-brown/30 h-dvh w-3 -translate-y-1/2",

          isCollapsed && [
            "flex h-16 w-5 items-center justify-center",
            "rounded-r-md",
            "border border-l-0 border-border",
            "bg-retro-brown/10",
            "shadow-sm",
            "hover:bg-retro-brown/20",
          ],
        )}
      >
        {isCollapsed && (
          <div className="bg-retro-brown/60 h-8 w-1 rounded-full" />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
