import { useState } from "react";

import { useKanban } from "../contexts/KanbanContext";

export const useKanbanBoard = () => {
  const {
    dos,
    moveDo,
    editColumn,
    deleteColumn,

    editingDoId,
    handleEditDo,
    handleCloseDoEditor,
  } = useKanban();

  const [draggedDoId, setDraggedDoId] = useState<number | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);
  const [movingDoId, setMovingDoId] = useState<number | null>(null);
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
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;

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

  const handleEditDoFromBoard = (id: number) => {
    if (draggedDoId !== null) return;

    handleEditDo(id);
  };

  const handleEditColumn = (id: number) => {
    setEditingColumnId(id);
  };

  const handleCloseColumnEditor = () => {
    setEditingColumnId(null);
  };

  const handleSaveColumn = async (id: number, name: string) => {
    try {
      await editColumn(id, name);
      setEditingColumnId(null);
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
      await deleteColumn(id);
    } catch (error) {
      console.error("Failed to delete column:", error);
    }
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

    handleEditDo: handleEditDoFromBoard,
    handleCloseDoEditor,

    handleEditColumn,
    handleCloseColumnEditor,
    handleSaveColumn,

    handleDeleteColumn,
  };
};
