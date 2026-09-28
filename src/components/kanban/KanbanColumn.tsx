import { twMerge } from "tailwind-merge";
import { MoreHorizontal } from "lucide-react";

import type { Column, Do } from "../../db/schema";

import KanbanCard from "./KanbanCard";

type KanbanColumnProps = {
  column: Column;
  dos: Do[];
  doId: string | null;

  draggedDoId: number | null;
  dragOverColumnId: number | null;
  movingDoId: number | null;

  onDragStart: (event: React.DragEvent<HTMLDivElement>, id: number) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLElement>, columnId: number) => void;
  onDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>, columnId: number) => void;

  onEditDo: (id: number) => void;
  onEditColumn: (id: number) => void;
};

const KanbanColumn = ({
  column,
  dos,
  doId,
  draggedDoId,
  dragOverColumnId,
  movingDoId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditDo,
  onEditColumn,
}: KanbanColumnProps) => {
  const columnDos = dos.filter((doItem) => doItem.column_id === column.id);

  const isDragOver = dragOverColumnId === column.id;

  return (
    <article
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, column.id)}
      onDragOver={(event) => onDragOver(event, column.id)}
      className={twMerge(
        "min-w-0 border border-border bg-card p-2 transition-colors",
        isDragOver && "border-green-500 bg-green-500/5",
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="leading-8 font-semibold text-text">{column.name}</h2>

        <div className="flex items-center gap-1">
          <span className="text-xs text-text-muted tabular-nums">
            {columnDos.length} {columnDos.length === 1 ? "do" : "dos"}
          </span>

          <button
            type="button"
            aria-label={`Edit ${column.name}`}
            onClick={() => onEditColumn(column.id)}
            className="flex size-7 items-center justify-center text-text-muted transition-colors hover:bg-background hover:text-text"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div
        className={twMerge(
          "mt-4 flex min-h-20 flex-col gap-2 rounded",
          isDragOver && "bg-green-500/5",
        )}
      >
        {columnDos.map((doItem) => {
          const isDragging = draggedDoId === doItem.id;
          const isMoving = movingDoId === doItem.id;

          return (
            <div
              key={doItem.id}
              draggable={!isMoving}
              onDragEnd={onDragEnd}
              onDragStart={(event) => onDragStart(event, doItem.id)}
              className={twMerge(
                "cursor-grab transition-opacity active:cursor-grabbing",
                isDragging && "opacity-40",
                isMoving && "pointer-events-none opacity-50",
              )}
            >
              <KanbanCard
                doItem={doItem}
                onClick={() => onEditDo(doItem.id)}
                className={twMerge(
                  Number(doId) === doItem.id && "border border-green-500",
                )}
              />
            </div>
          );
        })}

        {columnDos.length === 0 && (
          <div
            className={twMerge(
              "flex min-h-20 items-center justify-center",
              "text-sm text-text-muted",
              isDragOver &&
                "border border-dashed border-green-500 text-green-500",
            )}
          >
            {isDragOver ? "Drop here" : "No cards"}
          </div>
        )}
      </div>
    </article>
  );
};

export default KanbanColumn;
