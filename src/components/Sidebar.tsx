import { twMerge } from "tailwind-merge";
import { useState, useRef, useEffect } from "react";

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

const Sidebar = ({ className }: { className?: string }) => {
  const [width, setWidth] = useState(256);
  const isDragging = useRef(false);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging.current) return;

      const newWidth = Math.min(Math.max(event.clientX, MIN_WIDTH), MAX_WIDTH);

      setWidth(newWidth);
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

  const handlePointerDown = () => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <aside
      style={{ width }}
      className={twMerge(
        "h-dvh w-full shrink-0 border-r border-primary",
        className,
      )}
    >
      <h1 className="p-2">Just Do it</h1>

      <div className="flex flex-col">{/* Sidebar content */}</div>

      <div
        onPointerDown={handlePointerDown}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary"
      />
    </aside>
  );
};

export default Sidebar;
