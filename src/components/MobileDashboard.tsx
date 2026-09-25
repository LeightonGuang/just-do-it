import { twMerge } from "tailwind-merge";
import { useEffect, useRef, useState } from "react";

import Kanban from "./Kanban";
import MobileSidebar from "./Sidebar/MobileSidebar";

const TOP_GAP = 64;
const SNAP_DISTANCE = 0.15;
const SNAP_DURATION = 750;

const MobileDashboard = ({
  className,
  doId,
}: {
  className?: string;
  doId: string | null;
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [dragY, setDragY] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const pointerStartY = useRef(0);
  const startOffset = useRef(0);
  const didDrag = useRef(false);

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();

    window.addEventListener("resize", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const getClosedY = () => viewportHeight;
  const getOpenY = () => TOP_GAP;

  const getCurrentY = () => {
    if (dragY !== null) {
      return dragY;
    }

    if (viewportHeight === 0) {
      return 0;
    }

    return sidebarOpen ? getOpenY() : getClosedY();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    pointerStartY.current = event.clientY;
    startOffset.current = getCurrentY();
    didDrag.current = false;

    event.currentTarget.setPointerCapture(event.pointerId);

    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;

    const delta = event.clientY - pointerStartY.current;

    if (Math.abs(delta) > 5) {
      didDrag.current = true;
    }

    const nextY = startOffset.current + delta;

    const minY = getOpenY();
    const maxY = getClosedY();

    setDragY(Math.min(Math.max(nextY, minY), maxY));
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;

    event.currentTarget.releasePointerCapture(event.pointerId);

    const currentY = getCurrentY();

    const openY = getOpenY();
    const closedY = getClosedY();

    const travelDistance = closedY - openY;
    const dragDistance = currentY - startOffset.current;
    const threshold = travelDistance * SNAP_DISTANCE;

    let nextOpen = sidebarOpen;

    if (!sidebarOpen) {
      // Closed → drag UP 15% → open.
      if (dragDistance <= -threshold) {
        nextOpen = true;
      }
    } else {
      // Open → drag DOWN 15% → close.
      if (dragDistance >= threshold) {
        nextOpen = false;
      }
    }

    setDragging(false);
    setDragY(null);
    setSidebarOpen(nextOpen);
  };

  const handleClick = () => {
    // Pointer dragging already decided the state.
    // Prevent the click generated after a drag from toggling again.
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }

    setSidebarOpen((open) => !open);
  };

  const currentY = getCurrentY();

  return (
    <div className={twMerge("relative min-h-dvh bg-background", className)}>
      <Kanban doId={doId} />

      <div
        className="fixed inset-x-0 bottom-0 z-50"
        style={{
          height: `calc(100dvh - ${TOP_GAP}px)`,
          transform:
            viewportHeight > 0
              ? `translateY(${currentY - TOP_GAP}px)`
              : "translateY(calc(100dvh - 64px))",
          transition: dragging
            ? "none"
            : `transform ${SNAP_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1)`,
        }}
      >
        <MobileSidebar className="h-full overflow-y-auto overscroll-contain bg-sidebar" />

        <button
          type="button"
          onClick={handleClick}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          className="absolute top-0 left-1/2 z-60 flex h-10 w-20 -translate-x-1/2 -translate-y-full cursor-grab touch-none items-center justify-center rounded-t-xl border-x border-t border-border bg-sidebar shadow-[0_-2px_6px_-1px_rgba(0,0,0,0.1)] select-none active:cursor-grabbing"
        >
          <span className="h-1.5 w-12 rounded-full bg-text-muted" />
        </button>
      </div>
    </div>
  );
};

export default MobileDashboard;
