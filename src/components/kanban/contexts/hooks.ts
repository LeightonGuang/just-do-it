import { useCallback, useState } from "react";

import type { KanbanDo } from "./types";

/** Hook for managing DO (task) reordering state */
type UseDoReorderOptions = {
  projectId: string | null;
};

export const useDoReorder = ({ projectId }: UseDoReorderOptions) => {
  const [draggedDoId, setDraggedDoId] = useState<number | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);
  const [movingDoId, setMovingDoId] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, id: number) => {
      setDraggedDoId(id);

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(id));
    },
    [setDraggedDoId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedDoId(null);
    setDragOverColumnId(null);
    setMovingDoId(null);
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>, columnId: number) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      // Only handle DO dragging over columns for moving cards between columns
      if (draggedDoId !== null) {
        if (dragOverColumnId !== columnId) {
          setDragOverColumnId(columnId);
        }
        return;
      }

      // Handle column reordering - only when dropping on the drop zone, not just hovering
      // The drop zone will handle this via its own onDrop/onDragOver handlers
    },
    [draggedDoId, dragOverColumnId],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node)) return;

      setDragOverColumnId(null);
    },
    [],
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLElement>, columnId: number) => {
      event.preventDefault();

      // Handle DO being dropped into a column
      const draggedDoId = Number(event.dataTransfer.getData("text/plain"));

      if (!draggedDoId) return;

      setDragOverColumnId(null);
      setDraggedDoId(null);

      try {
        setMovingDoId(draggedDoId);

        // Get all DOs for the project to determine new position
        const response = await fetch(`/api/projects/${projectId}/dos`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch DOs");
        }

        const projectDos = (await response.json()) as Array<{
          id: number;
          position: number;
          title: string;
          column_id: number;
          project_id: number;
        }>;

        // Find the target column's current DOs
        const targetDos = projectDos.filter((doItem) => doItem.column_id === columnId);
        if (!targetDos.length) return;

        // Get dragged DO info
        const draggedDo = projectDos.find((doItem) => doItem.id === draggedDoId);
        if (!draggedDo) return;

        // Calculate new position based on drop location (vertical position in the DOM)
        const targetRect = event.currentTarget.getBoundingClientRect();
        const mouseY = event.clientY - targetRect.top;
        const targetHeight = targetRect.height;

        // Get current positions of all DOs for this column, sorted by position
        const sortedDos = [...targetDos].sort((a, b) => a.position - b.position);
        
        // Find the index of the dragged DO in the sorted list
        const draggedIndex = sortedDos.findIndex((doItem) => doItem.id === draggedDoId);

        if (draggedIndex === -1) return;

        // Determine the new position based on where we dropped relative to the target column
        let newIndex: number;
        if (mouseY < targetHeight / 2) {
          // Drop in upper half - insert before target
          // If dragged DO is after target, move it before target
          // If dragged DO is before or at target, keep it where it is
          newIndex = draggedIndex > 0 ? draggedIndex - 1 : draggedIndex;
        } else {
          // Drop in lower half - insert after target
          // If dragged DO is before or at target, move it after target
          // If dragged DO is after target, keep it where it is
          newIndex = draggedIndex < targetDos.length - 1 ? draggedIndex + 1 : draggedIndex;
        }

        // Calculate the new position value (0-indexed)
        const newPosition = newIndex;

        // Get the dragged DO's current data to preserve its other fields
        const draggedDoResponse = await fetch(`/api/dos/${draggedDoId}`, {
          cache: "no-store",
        });

        if (!draggedDoResponse.ok) {
          throw new Error("Failed to fetch dragged DO");
        }

        const draggedDoData = (await draggedDoResponse.json()) as { task: KanbanDo };

        // Update the dragged DO's position via API
        await fetch(`/api/dos/${draggedDoId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: draggedDoData.task.title,
            description: draggedDoData.task.description || undefined,
            start_at: draggedDoData.task.start_at ? new Date(draggedDoData.task.start_at).toISOString() : undefined,
            end_at: draggedDoData.task.end_at ? new Date(draggedDoData.task.end_at).toISOString() : undefined,
            position: newPosition,
          }),
          cache: "no-store",
        });

      } catch (error) {
        console.error("Failed to reorder DOs:", error);
      } finally {
        setMovingDoId(null);
      }
    },
    [projectId],
  );

  return {
    draggedDoId,
    setDraggedDoId,
    dragOverColumnId,
    setDragOverColumnId,
    movingDoId,
    setMovingDoId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};