import { useState } from "react";

import type { Column } from "../../../db";

/** Hook for managing column reordering operations only */
export const useKanbanBoard = () => {
  const [draggedColumnId, setDraggedColumnId] = useState<number | null>(null);
  const [dragOverColumnForReorder, setDragOverColumnForReorder] = useState<number | null>(null);
  const [movingColumnId, setMovingColumnId] = useState<number | null>(null);

  const handleDropColumn = async (
    event: React.DragEvent<HTMLElement>,
    targetColumnId: number,
  ) => {
    event.preventDefault();

    // Handle column being dropped on another column for reordering
    if (!draggedColumnId || draggedColumnId === targetColumnId) return;

    setDragOverColumnForReorder(null);
    setDraggedColumnId(null);

    try {
      setMovingColumnId(draggedColumnId);

      // Get all columns for the project to determine new position
      const response = await fetch(`/api/projects/columns`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch columns");
      }

      const projectColumns = (await response.json()) as Array<{ id: number; position: number; name: string; project_id: number }>;

      // Find the target column's current position
      const targetColumn = projectColumns.find((col) => col.id === targetColumnId);
      if (!targetColumn) return;

      // Get dragged column info
      const draggedColumn = projectColumns.find((col) => col.id === draggedColumnId);
      if (!draggedColumn) return;

      // Calculate new position based on drop location (vertical position in the DOM)
      const targetRect = event.currentTarget.getBoundingClientRect();
      const mouseY = event.clientY - targetRect.top;
      const targetHeight = targetRect.height;

      // Get current positions of all columns for this project, sorted by position
      const sortedColumns = [...projectColumns].sort((a, b) => a.position - b.position);
      
      // Find the index of the dragged column and target column in the sorted list
      const draggedIndex = sortedColumns.findIndex(col => col.id === draggedColumnId);
      const targetIndex = sortedColumns.findIndex(col => col.id === targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Determine the new position based on where we dropped relative to the target column
      let newIndex: number;
      if (mouseY < targetHeight / 2) {
        // Drop in upper half - insert before target
        // If dragged column is after target, move it before target
        // If dragged column is before or at target, keep it where it is
        newIndex = draggedIndex > targetIndex ? targetIndex : draggedIndex;
      } else {
        // Drop in lower half - insert after target
        // If dragged column is before or at target, move it after target
        // If dragged column is after target, keep it where it is
        newIndex = draggedIndex < targetIndex ? targetIndex + 1 : draggedIndex;
      }

      // Calculate the new position value (1-indexed)
      const newPosition = newIndex + 1;

      // Get the dragged column's current data to preserve its name
      const draggedColumnResponse = await fetch(`/api/columns/${draggedColumnId}`, {
        cache: "no-store",
      });

      if (!draggedColumnResponse.ok) {
        throw new Error("Failed to fetch dragged column");
      }

      const draggedColumnData = (await draggedColumnResponse.json()) as { column: { name: string; position: number } };

      // Update the dragged column's position via API
      await fetch(`/api/columns/${draggedColumnId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: draggedColumnData.column.name,
          position: newPosition,
        }),
        cache: "no-store",
      });

    } catch (error) {
      console.error("Failed to reorder columns:", error);
    } finally {
      setMovingColumnId(null);
    }
  };

  const handleSaveColumn = async (id: number, name: string) => {
    try {
      await fetch(`/api/columns/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
        cache: "no-store",
      });
    } catch (error) {
      console.error("Failed to edit column:", error);
      throw error;
    }
  };

  const handleDeleteColumn = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this column? All cards in this column will also be deleted.",
    );

    if (!confirmed) return;

    try {
      await fetch(`/api/columns/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });
    } catch (error) {
      console.error("Failed to delete column:", error);
    }
  };

  return {
    draggedColumnId,
    setDraggedColumnId,
    dragOverColumnForReorder,
    setDragOverColumnForReorder,
    movingColumnId,
    setMovingColumnId,
    handleDropColumn,
    handleSaveColumn,
    handleDeleteColumn,
  };
};