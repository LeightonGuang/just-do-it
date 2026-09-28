import { twMerge } from "tailwind-merge";
import { MoreHorizontal, Plus } from "lucide-react";

import KanbanCard from "./KanbanCard";
import { useKanban } from "./contexts/KanbanContext";
import { useKanbanBoard } from "./hooks/useKanbanBoard";
import KanbanEditDrawer from "./projects/KanbanEditDrawer";

const Kanban = ({
  doId,
  className,
}: {
  doId: string | null;
  className?: string;
}) => {
  const { loading, error, project, columns, dos } = useKanban();

  const {
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
  } = useKanbanBoard();

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
    <section className={twMerge("relative min-h-dvh", className)}>
      <div className="dot-grid min-h-dvh p-4 md:p-8 md:pb-24">
        <div className="flex items-start justify-between">
          <h1 className="flex items-center gap-4 text-xl leading-4 font-medium text-text">
            <div
              className="size-4 shrink-0"
              style={{ backgroundColor: project.colour }}
            />
            {project.name}
          </h1>

          <button
            type="button"
            onClick={() => {
              // Open add column drawer/modal
            }}
            className="flex items-center gap-1.5 border border-border bg-card px-4 py-2 text-xs text-text-muted transition-colors hover:bg-background hover:text-text"
          >
            <Plus className="size-3.5" />
            <span>Add column</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-4 pb-12 md:mt-8 md:gap-8 md:pb-0">
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
                  "min-w-0 border border-border bg-card p-2 transition-colors",
                  isDragOver && "border-green-500 bg-green-500/5",
                )}
              >
                <div className="flex items-center justify-between">
                  <h2 className="leading-8 font-semibold text-text">
                    {column.name}
                  </h2>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-text-muted tabular-nums">
                      {columnDos.length} {columnDos.length === 1 ? "do" : "dos"}
                    </span>

                    <button
                      type="button"
                      aria-label={`Edit ${column.name}`}
                      onClick={() => handleEditColumn(column.id)}
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
                          onClick={() => handleEdit(doItem.id)}
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
          })}
        </div>
      </div>

      <KanbanEditDrawer doId={editingDoId} onClose={handleCloseEditor} />

      {editingColumnId !== null && <div>{/* Column editor goes here */}</div>}
    </section>
  );
};

export default Kanban;
