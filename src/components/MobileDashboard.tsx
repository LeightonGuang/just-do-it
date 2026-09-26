import { twMerge } from "tailwind-merge";
import { useEffect, useRef, useState } from "react";

import Kanban from "./Kanban";
import MobileSidebar from "./Sidebar/MobileSidebar";

const TOP_GAP = 64;
const SNAP_DISTANCE = 0.1;
const SNAP_DURATION = 750;

const MobileDashboard = ({
  className,
  doId,
  projectId,
}: {
  className?: string;
  doId: string | null;
  projectId: string | null;
}) => {
  const hasProject = projectId !== null;

  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [dragY, setDragY] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const pointerStartY = useRef(0);
  const startOffset = useRef(0);
  const didDrag = useRef(false);

  useEffect(() => {
    setMounted(true);

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
    if (!mounted) return;

    if (!hasProject) {
      setSidebarOpen(true);
      setDragY(null);
      setDragging(false);
    } else {
      setSidebarOpen(false);
      setDragY(null);
      setDragging(false);
    }
  }, [mounted, hasProject]);

  useEffect(() => {
    if (!sidebarOpen || !hasProject) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen, hasProject]);

  const topGap = hasProject ? TOP_GAP : 0;

  const getClosedY = () => viewportHeight;
  const getOpenY = () => topGap;

  const getCurrentY = () => {
    if (dragY !== null) return dragY;

    if (viewportHeight === 0) return 0;

    return sidebarOpen ? getOpenY() : getClosedY();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!hasProject) return;

    pointerStartY.current = event.clientY;
    startOffset.current = getCurrentY();
    didDrag.current = false;

    event.currentTarget.setPointerCapture(event.pointerId);

    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || !hasProject) return;

    const delta = event.clientY - pointerStartY.current;

    if (Math.abs(delta) > 5) didDrag.current = true;

    const nextY = startOffset.current + delta;

    const minY = getOpenY();
    const maxY = getClosedY();

    setDragY(Math.min(Math.max(nextY, minY), maxY));
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || !hasProject) return;

    event.currentTarget.releasePointerCapture(event.pointerId);

    const currentY = getCurrentY();
    const openY = getOpenY();
    const closedY = getClosedY();

    const travelDistance = closedY - openY;
    const dragDistance = currentY - startOffset.current;
    const threshold = travelDistance * SNAP_DISTANCE;

    let nextOpen = sidebarOpen;

    if (!sidebarOpen) {
      if (dragDistance <= -threshold) nextOpen = true;
    } else if (dragDistance >= threshold) {
      nextOpen = false;
    }

    setDragging(false);
    setDragY(null);
    setSidebarOpen(nextOpen);
  };

  const handleClick = () => {
    if (!hasProject) return;

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
          height: `calc(100dvh - ${topGap}px)`,

          transform:
            viewportHeight > 0
              ? `translateY(${currentY - topGap}px)`
              : "translateY(100dvh)",

          transition:
            !mounted || !hasProject || dragging
              ? "none"
              : `transform ${SNAP_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1)`,
        }}
      >
        <MobileSidebar className="h-full overflow-y-auto overscroll-contain bg-sidebar" />

        {hasProject && (
          <button
            type="button"
            onClick={handleClick}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="absolute top-0 left-1/2 z-60 flex h-8 w-20 -translate-x-1/2 -translate-y-full cursor-grab touch-none items-center justify-center rounded-t-xs border-x border-t border-border bg-sidebar shadow-[0_-2px_6px_-1px_rgba(0,0,0,0.1)] select-none active:cursor-grabbing"
          >
            <span className="h-1.5 w-12 rounded-xs bg-text-muted" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileDashboard;
