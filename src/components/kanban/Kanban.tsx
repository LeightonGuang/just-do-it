import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Check, Pencil, Plus, X } from "lucide-react";

import { useKanban } from "./contexts";
import KanbanColumn from "./KanbanColumn";
import { useKanbanBoard } from "./hooks/useKanbanBoard";
import DoDrawer from "./doDrawer/doDrawer";

const Kanban = ({
  doId,
  className,
}: {
  doId: string | null;
  className?: string;
}) => {
  const {
    error,
    project,
    columns,
    loading,
    dos,
    tags,

    projectName,
    projectColour,
    savingProject,
    editingProject,

    saveProject,
    setProjectName,
    setProjectColour,
    startEditingProject,
    cancelEditingProject,
    handleCreateDo,
    deleteDo,
  } = useKanban();

  const {
    editingDoId,
    editingColumnId,
    handleEditDo,
    handleCloseDoEditor,
  } = useKanbanBoard();

  const {
    isCreatingMode,
    creatingDoId,
    setCreatingDoId,
    setIsCreatingMode,
  } = useKanban();

  const [createColumnId, setCreateColumnId] = useState<number | undefined>(undefined);

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

  // Find the DO object for editing mode
  const editingDo = editingDoId ? dos.find((doItem) => doItem.id === editingDoId) : null;

  return (
    <section className={twMerge("relative min-h-dvh", className)}>
      <div className="dot-grid min-h-dvh p-4 md:p-8 md:pb-24">
        <div className="flex h-4 items-center justify-between">
          {editingProject ? (
            <div className="flex items-center gap-3">
              {/* Colour picker */}
              <label
                title="Change project colour"
                style={{
                  backgroundColor: projectColour,
                }}
                className="relative size-4 shrink-0 cursor-pointer overflow-hidden"
              >
                <input
                  type="color"
                  value={projectColour}
                  disabled={savingProject}
                  onChange={(event) => {
                    setProjectColour(event.target.value);
                  }}
                  className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
              </label>

              {/* Project name */}
              <input
                autoFocus
                type="text"
                value={projectName}
                disabled={savingProject}
                placeholder="Project name"
                onChange={(event) => {
                  setProjectName(event.target.value);
                }}
                className="w-64 border border-border bg-card px-2 py-1 text-sm text-text outline-none focus:border-text-muted disabled:opacity-50"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void saveProject();
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelEditingProject();
                  }
                }}
              />

              {/* Save */}
              <button
                type="button"
                title="Save project"
                aria-label="Save project"
                onClick={() => {
                  void saveProject();
                }}
                disabled={savingProject || !projectName.trim()}
                className="flex size-7 items-center justify-center text-text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="size-4 text-success hover:text-success-hover" />
              </button>

              {/* Cancel */}
              <button
                type="button"
                title="Cancel editing"
                disabled={savingProject}
                aria-label="Cancel editing"
                onClick={cancelEditingProject}
                className="flex size-7 items-center justify-center text-text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="size-4 text-danger hover:text-danger-hover" />
              </button>
            </div>
          ) : (
            <div className="flex h-4 items-center gap-3">
              {/* Project colour */}
              <div
                className="size-4 shrink-0"
                style={{
                  backgroundColor: project.colour,
                }}
              />

              {/* Project name */}
              <h1 className="text-xl leading-4 font-medium text-text">
                {project.name}
              </h1>

              {/* Edit */}
              <button
                type="button"
                title="Edit project"
                aria-label="Edit project"
                onClick={startEditingProject}
                className="flex items-center justify-center text-text-muted transition-colors hover:text-text"
              >
                <Pencil className="size-4" />
              </button>
            </div>
          )}

          {/* Add column */}
          <button
            type="button"
            onClick={() => {
              // Open add column drawer/modal
            }}
            className="flex items-center gap-1.5 border border-border bg-card px-2 py-1 text-xs text-text-muted transition-colors hover:bg-background hover:text-text"
          >
            <Plus className="size-3.5" />

            <span>Add column</span>
          </button>
        </div>

        {/* Kanban columns */}
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-4 pb-12 md:mt-8 md:gap-8 md:pb-0">
          {columns.map((column) => (
            <KanbanColumn
              doId={doId}
              key={column.id}
              column={column}
              onCreateDoClick={() => {
                handleCloseDoEditor();
                setIsCreatingMode(true);
                setCreatingDoId(null);
                setCreateColumnId(column.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Backdrop - closes when clicking outside */}
      {(creatingDoId || editingDoId) && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={handleCloseDoEditor}
        />
      )}

      <DoDrawer
        doId={creatingDoId || editingDoId}
        isCreating={isCreatingMode}
        createColumnId={createColumnId}
        onClose={handleCloseDoEditor}
        onCreate={isCreatingMode ? handleCreateDo : undefined}
        onDelete={deleteDo}
        doData={editingDo ?? undefined}
        tags={tags}
      />

      {editingColumnId !== null && <div>{/* Column editor goes here */}</div>}
    </section>
  );
};

export default Kanban;