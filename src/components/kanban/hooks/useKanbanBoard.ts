import { useState } from "react";
type BoardColumn = { id: number; position: number };
export const useKanbanBoard = ({ projectId, columns, onReordered }: { projectId: string | null; columns: BoardColumn[]; onReordered: (updates: BoardColumn[]) => void }) => {
  const [draggedColumnId, setDraggedColumnId] = useState<number | null>(null);
  const [dragOverColumnForReorder, setDragOverColumnForReorder] = useState<number | null>(null);
  const [movingColumnId, setMovingColumnId] = useState<number | null>(null);
  const handleDropColumn = async (event: React.DragEvent<HTMLElement>, targetColumnId: number, insertAfter = false) => {
    event.preventDefault();
    if (draggedColumnId === null || draggedColumnId === targetColumnId || !projectId) return;
    const ordered = [...columns].sort((a, b) => a.position - b.position);
    const remaining = ordered.filter((column) => column.id !== draggedColumnId);
    const targetIndex = remaining.findIndex((column) => column.id === targetColumnId);
    const dragged = ordered.find((column) => column.id === draggedColumnId);
    if (targetIndex < 0 || !dragged) return;
    remaining.splice(targetIndex + (insertAfter ? 1 : 0), 0, dragged);
    const previous = remaining[targetIndex + (insertAfter ? 1 : 0) - 1]?.position;
    const next = remaining[targetIndex + (insertAfter ? 1 : 0) + 1]?.position;
    const insertionIndex = targetIndex + (insertAfter ? 1 : 0);
    const gap = previous === undefined || next === undefined ? Infinity : next - previous;
    const updates = gap > 1
      ? remaining.map((column, index) => ({
          id: column.id,
          position: index === insertionIndex
            ? (previous === undefined ? (next ?? 1000) - 1000 : next === undefined ? previous + 1000 : Math.floor((previous + next) / 2))
            : column.position,
        }))
      : remaining.map((column, index) => ({ id: column.id, position: index * 1000 }));
    setDragOverColumnForReorder(null); setDraggedColumnId(null); setMovingColumnId(draggedColumnId);
    try {
      const responses = await Promise.all(updates.map((update) => fetch(`/api/columns/${update.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: update.position }), cache: "no-store" })));
      if (responses.some((response) => !response.ok)) throw new Error("Failed to reorder columns");
      onReordered(updates);
    } catch (error) { console.error("Failed to reorder columns:", error); } finally { setMovingColumnId(null); }
  };
  const handleSaveColumn = async (id: number, name: string) => { const response = await fetch(`/api/columns/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }), cache: "no-store" }); if (!response.ok) throw new Error("Failed to edit column"); };
  const handleDeleteColumn = async (id: number) => { if (!window.confirm("Are you sure you want to delete this column? All cards in this column will also be deleted.")) return; const response = await fetch(`/api/columns/${id}`, { method: "DELETE", cache: "no-store" }); if (!response.ok) throw new Error("Failed to delete column"); };
  return { draggedColumnId, setDraggedColumnId, dragOverColumnForReorder, setDragOverColumnForReorder, movingColumnId, setMovingColumnId, handleDropColumn, handleSaveColumn, handleDeleteColumn };
};
