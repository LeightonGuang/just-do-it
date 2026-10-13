import { useState, useCallback, useEffect } from 'react';
import type { KanbanDo } from '../types';

type UseDoReorderOptions = {
  projectId: string | null;
};

export const useDoReorder = ({ projectId }: UseDoReorderOptions) => {
  // State for drag operations
  const [draggedDoId, setDraggedDoId] = useState<number | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);
  const [movingDoId, setMovingDoId] = useState<number | null>(null);

  // Handlers for drag operations
  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, id: number) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(id));
      setDraggedDoId(id);
      setMovingDoId(id);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedDoId(null);
    setMovingDoId(null);
    setDragOverColumnId(null);
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>, columnId: number) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      
      // Only update if dragging a different DO and over a different column
      if (draggedDoId !== null && draggedDoId !== columnId) {
        setDragOverColumnId(columnId);
      }
    },
    [draggedDoId],
  );

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    // Clear drag over state when leaving the drop zone
    if (event.relatedTarget === null) {
      setDragOverColumnId(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLElement>, columnId: number) => {
      event.preventDefault();
      
      const droppedDoId = Number(event.dataTransfer.getData('text/plain'));
      if (!droppedDoId || draggedDoId === null) return;

      // Only handle drops when dragging a different DO to a different column
      if (draggedDoId !== columnId && projectId) {
        try {
          await fetch(`/api/dos/${draggedDoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column_id: columnId }),
          });
        } catch (error) {
          console.error('Failed to move DO:', error);
        } finally {
          setDraggedDoId(null);
          setMovingDoId(null);
          setDragOverColumnId(null);
        }
      }
    },
    [draggedDoId, projectId],
  );

  return {
    draggedDoId,
    dragOverColumnId,
    movingDoId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};