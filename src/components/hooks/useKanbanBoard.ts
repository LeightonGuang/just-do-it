import { useState } from "react";

import { useKanban } from "../contexts/KanbanContext";

export const useKanbanBoard = () => {
  const { dos, moveDo } = useKanban();

  const [draggedDoId, setDraggedDoId] = useState<number | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);
  const [movingDoId, setMovingDoId] = useState<number | null>(null);
  const [editingDoId, setEditingDoId] = useState<number | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    id: number,
  ) => {
    setDraggedDoId(id);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
  };

  const handleDragEnd = () => {
    setDraggedDoId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLElement>,
    columnId: number,
  ) => {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }

    setDragOverColumnId(null);
  };

  const handleDrop = async (
    event: React.DragEvent<HTMLElement>,
    columnId: number,
  ) => {
    event.preventDefault();

    const droppedDoId = Number(event.dataTransfer.getData("text/plain"));

    setDragOverColumnId(null);
    setDraggedDoId(null);

    if (!droppedDoId) return;

    const doItem = dos.find((item) => item.id === droppedDoId);

    if (!doItem || doItem.column_id === columnId) {
      return;
    }

    try {
      setMovingDoId(droppedDoId);

      await moveDo(droppedDoId, columnId);
    } catch (error) {
      console.error("Failed to move card:", error);
    } finally {
      setMovingDoId(null);
    }
  };

  const handleEdit = (id: number) => {
    if (draggedDoId !== null) return;

    setEditingDoId(id);
  };

  const handleCloseEditor = () => {
    setEditingDoId(null);
  };

  const handleEditColumn = (id: number) => {
    setEditingColumnId(id);
  };

  const handleCloseColumnEditor = () => {
    setEditingColumnId(null);
  };

  return {
    draggedDoId,
    dragOverColumnId,
    movingDoId,

    editingDoId,
    editingColumnId,

    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,

    handleEdit,
    handleCloseEditor,

    handleEditColumn,
    handleCloseColumnEditor,
  };
};
