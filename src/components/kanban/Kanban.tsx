import { Plus } from "lucide-react";
import { twMerge } from "tailwind-merge";

import KanbanColumn from "./KanbanColumn";

import { useKanban } from "./contexts/KanbanContext";
import { useKanbanBoard } from "./hooks/useKanbanBoard";

import KanbanEditDrawer from "../projects/KanbanEditDrawer";

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

    handleEditDo,
    handleCloseDoEditor,

    handleEditColumn,
    handleCloseColumnEditor,
    handleSaveColumn,

    handleDeleteColumn,
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
              style={{
                backgroundColor: project.colour,
              }}
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
          {columns.map((column) => (
            <KanbanColumn
              dos={dos}
              doId={doId}
              key={column.id}
              column={column}
              onDrop={handleDrop}
              movingDoId={movingDoId}
              onEditDo={handleEditDo}
              draggedDoId={draggedDoId}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              onDragLeave={handleDragLeave}
              onEditColumn={handleEditColumn}
              onSaveColumn={handleSaveColumn}
              editingColumnId={editingColumnId}
              dragOverColumnId={dragOverColumnId}
              onDeleteColumn={handleDeleteColumn}
              onCloseColumnEditor={handleCloseColumnEditor}
            />
          ))}
        </div>
      </div>

      <KanbanEditDrawer doId={editingDoId} onClose={handleCloseDoEditor} />

      {editingColumnId !== null && <div>{/* Column editor goes here */}</div>}
    </section>
  );
};

export default Kanban;
