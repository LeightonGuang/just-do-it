import { useState } from "react";
import { twMerge } from "tailwind-merge";

import KanbanCard from "./KanbanCard";
import { useKanban } from "./contexts/KanbanContext";

const Kanban = ({
  doId,
  className,
}: {
  doId: string | null;
  className?: string;
}) => {
  const { loading, error, project, columns, dos, moveDo } = useKanban();

  const [draggedDoId, setDraggedDoId] = useState<number | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);
  const [movingDoId, setMovingDoId] = useState<number | null>(null);

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
    // Don't remove the highlight when moving between
    // children inside the same column.
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

    if (!doItem) return;

    // Already in this column.
    if (doItem.column_id === columnId) return;

    try {
      setMovingDoId(droppedDoId);

      await moveDo(droppedDoId, columnId);
    } catch (error) {
      console.error("Failed to move card:", error);
    } finally {
      setMovingDoId(null);
    }
  };

  if (loading) {
    return (
      <section className="min-h-dvh p-8">
        <p className="text-text-muted">Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-dvh p-8">
        <p className="text-danger">{error}</p>
      </section>
    );
  }

  if (!project) return null;

  return (
    <section className={twMerge("", className)}>
      <div className="dot-grid min-h-dvh p-4 md:p-8 md:pb-24">
        <h1 className="leading-4 font-medium text-text">{project.name}</h1>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 pb-12 md:mt-8 md:gap-8 md:pb-0">
          {columns.map((column) => {
            const columnDos = dos.filter(
              (doItem) => doItem.column_id === column.id,
            );

            const isDragOver = dragOverColumnId === column.id;

            return (
              <article
                key={column.id}
                onDragLeave={handleDragLeave}
                onDrop={(event) => handleDrop(event, column.id)}
                onDragOver={(event) => handleDragOver(event, column.id)}
                className={twMerge(
                  "border border-border bg-card p-2 transition-colors",
                  isDragOver && "border-green-500 bg-green-500/5",
                )}
              >
                <h2 className="leading-8 font-semibold text-text">
                  {column.name}
                </h2>

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
                        onDragEnd={handleDragEnd}
                        onDragStart={(event) =>
                          handleDragStart(event, doItem.id)
                        }
                        className={twMerge(
                          "cursor-grab transition-opacity active:cursor-grabbing",
                          isDragging && "opacity-40",
                          isMoving && "pointer-events-none opacity-50",
                        )}
                      >
                        <KanbanCard
                          doItem={doItem}
                          className={twMerge(
                            Number(doId) === doItem.id &&
                              "border border-green-500",
                          )}
                        />
                      </div>
                    );
                  })}

                  {columnDos.length === 0 && (
                    <div
                      className={twMerge(
                        "flex min-h-20 items-center justify-center rounded",
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
          })}
        </div>
      </div>
    </section>
  );
};

export default Kanban;
