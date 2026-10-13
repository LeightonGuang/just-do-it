import { useCallback, useState } from "react";

import type { KanbanDo } from "./types";

/** Hook for managing DO (task) reordering state */
type UseDoReorderOptions = {
  dos: KanbanDo[];
  onReordered?: (updates: Array<{ id: number; column_id: number; position: number }>) => void;
};

export const useDoReorder = ({ dos, onReordered }: UseDoReorderOptions) => {
  const [draggedDoId, setDraggedDoId] = useState<number | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<number | null>(null);
  const [dropBeforeCard, setDropBeforeCard] = useState(true);
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
    setDragOverCardId(null);
    setMovingDoId(null);
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>, columnId: number) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      // Only handle DO dragging over columns for moving cards between columns
      if (draggedDoId !== null) {
        const card = (event.target as HTMLElement).closest<HTMLElement>("[data-kanban-card]");
        if (card) {
          const rect = card.getBoundingClientRect();
          const targetId = Number(card.dataset.kanbanCard);
          const before = event.clientY < rect.top + rect.height / 2;
          const columnDos = dos
            .filter((item) => item.column_id === columnId)
            .sort((a, b) => a.position - b.position);
          const draggedIndex = columnDos.findIndex((item) => item.id === draggedDoId);
          const remainingDos = columnDos.filter((item) => item.id !== draggedDoId);
          const invalidSelfDrop = targetId === draggedDoId;
          const insertionIndex = remainingDos.findIndex((item) => item.id === targetId) + (before ? 0 : 1);
          const invalidAdjacentDrop =
            draggedIndex >= 0 && insertionIndex === draggedIndex;

          if (invalidSelfDrop || invalidAdjacentDrop) {
            setDragOverCardId(null);
          } else {
            setDragOverCardId(targetId);
            setDropBeforeCard(before);
          }
        } else {
          setDragOverCardId(null);
        }
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
      setDragOverCardId(null);
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

        const draggedDo = dos.find((item) => item.id === draggedDoId);
        if (!draggedDo) return;
        const targetDos = dos
          .filter((item) => item.column_id === columnId && item.id !== draggedDoId)
          .sort((a, b) => a.position - b.position);
        const targetCard = (event.target as HTMLElement).closest<HTMLElement>("[data-kanban-card]");
        let newIndex = targetDos.length;
        if (targetCard) {
          const targetId = Number(targetCard.dataset.kanbanCard);
          const targetIndex = targetDos.findIndex((item) => item.id === targetId);
          const rect = targetCard.getBoundingClientRect();
          const before = event.clientY < rect.top + rect.height / 2;
          if (targetId === draggedDoId) {
            return;
          }
          if (targetIndex >= 0) {
            newIndex = targetIndex + (before ? 0 : 1);
          }
        }

        const orderedDos = [...targetDos];
        orderedDos.splice(newIndex, 0, draggedDo);

        const sourceDos = dos
          .filter((item) => item.column_id === draggedDo.column_id && item.id !== draggedDoId)
          .sort((a, b) => a.position - b.position);
        const positionUpdates = [
          ...(draggedDo.column_id === columnId
            ? []
            : sourceDos.map((item, position) => ({ id: item.id, column_id: item.column_id, position }))),
          ...orderedDos.map((item, position) => ({ id: item.id, column_id: columnId, position })),
        ];

        const updates = await Promise.all(
          positionUpdates.map((item) =>
            fetch(`/api/dos/${item.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                column_id: item.column_id,
                position: item.position,
              }),
              cache: "no-store",
            }),
          ),
        );

        if (updates.some((response) => !response.ok)) {
          throw new Error("Failed to persist card order");
        }
        onReordered?.(positionUpdates);
      } catch (error) {
        console.error("Failed to reorder DOs:", error);
      } finally {
        setMovingDoId(null);
      }
    },
    [dos, onReordered],
  );

  return {
    draggedDoId,
    setDraggedDoId,
    dragOverColumnId,
    dragOverCardId,
    dropBeforeCard,
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
