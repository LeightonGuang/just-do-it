import { twMerge } from "tailwind-merge";
import { useEffect, useRef, useState } from "react";
import { Check, Flag, MoreHorizontal, Pencil, Trash, X } from "lucide-react";

import type { Column } from "../../db";

import KanbanCard from "./KanbanCard";
import { useKanban } from "./contexts";
import { useKanbanBoard } from "./hooks/useKanbanBoard";

type KanbanColumnProps = {
  column: Column;
  doId: string | null;
  onCreateDoClick?: () => void;
};

const KanbanColumn = ({ column, doId, onCreateDoClick }: KanbanColumnProps) => {
  const {
    dos,
    setColumnIsDone,
    editingColumnId,
    handleEditDo,
    // DO reordering handlers from context
    draggedDoId,
    dragOverColumnId,
    movingDoId,
    handleDragStart: handleDoDragStart,
    handleDragEnd: handleDoDragEnd,
    handleDragOver: handleDoDragOver,
    handleDragLeave: handleDoDragLeave,
    handleDrop: handleDoDrop,
  } = useKanban();

  const {
    handleSaveColumn,
    handleDeleteColumn,
    handleDropColumn,
    setDraggedColumnId,
    draggedColumnId,
    setDragOverColumnForReorder,
  } = useKanbanBoard();

  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState(column.name);
  const [saving, setSaving] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingColumnId === column.id;
  // Safety check for dos - prevents "Cannot read properties of undefined (reading 'filter')"
  const columnDos = Array.isArray(dos) ? dos.filter((doItem) => doItem.column_id === column.id) : [];
  const isDragOver = dragOverColumnId === column.id;

  // Add drag event handlers for column reordering
  useEffect(() => {
    if (draggedColumnId !== null) {
      const handleMouseMove = () => {
        document.body.style.cursor = "grabbing";
      };

      const handleMouseUp = () => {
        document.body.style.cursor = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedColumnId]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!isEditing) return;

    setName(column.name);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isEditing, column.name]);

  const [editingColumnLocal, setEditingColumnLocal] = useState(false);

  const handleEdit = () => {
    setMenuOpen(false);
    setEditingColumnLocal(true);
  };

  const handleDelete = async () => {
    setMenuOpen(false);

    await handleDeleteColumn(column.id);
  };

  const handleCancelEdit = () => {
    setName(column.name);
    setEditingColumnLocal(false);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || saving) return;

    try {
      setSaving(true);

      await handleSaveColumn(column.id, trimmedName);
    } finally {
      setSaving(false);
      setEditingColumnLocal(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSave();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelEdit();
    }
  };

  // Column drag end handler
  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
    setDragOverColumnForReorder(null);
  };

  // Use local editing state or context editing state
  const showEditor = editingColumnLocal || isEditing;

  return (
    <article
      onDragLeave={(event) => handleDoDragLeave(event)}
      onDrop={(event) => {
        // Only handle DO drops here, not column reordering
        const droppedDoId = Number(event.dataTransfer.getData("text/plain"));
        if (!droppedDoId) return;
        handleDoDrop(event, column.id);
      }}
      onDragOver={(event) => handleDoDragOver(event, column.id)}
      className={twMerge(
        "min-w-0 border border-border bg-card p-2 transition-colors",
        isDragOver && "border-green-500 bg-green-500/5",
        draggedColumnId === column.id && "opacity-50",
      )}
    >
      {/* Drag handle for column reordering */}
      {!showEditor && (
        <div
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("application/column-id", String(column.id));
            setDraggedColumnId(column.id);
          }}
          onDragEnd={handleColumnDragEnd}
          className="absolute -top-3 left-0 right-0 flex items-center justify-center cursor-grab hover:bg-background/50 rounded"
        >
          <div className="h-1.5 w-8 bg-border hover:bg-border-muted transition-colors" />
        </div>
      )}

      {/* Drop zone for column reordering */}
      {!showEditor && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDragOverColumnForReorder(column.id);
          }}
          onDragLeave={() => setDragOverColumnForReorder(null)}
          onDrop={async (event) => {
            event.preventDefault();
            await handleDropColumn(event, column.id);
            setDragOverColumnForReorder(null);
          }}
          className="absolute inset-0 z-10"
        />
      )}

      <div className="flex items-center justify-between gap-2">
        {showEditor ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input
              type="text"
              value={name}
              ref={inputRef}
              disabled={saving}
              onKeyDown={handleKeyDown}
              onChange={(event) => setName(event.target.value)}
              className="min-w-0 flex-1 border border-border bg-background px-2 py-1 text-sm font-semibold text-text outline-none focus:border-green-500"
            />

            <button
              type="button"
              aria-label="Save column"
              onClick={() => void handleSave()}
              disabled={!name.trim() || saving}
              className="flex size-7 shrink-0 items-center justify-center text-text-muted transition-colors hover:bg-background hover:text-green-500 disabled:opacity-50"
            >
              <Check className="size-4" />
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleCancelEdit}
              aria-label="Cancel editing"
              className="flex size-7 shrink-0 items-center justify-center text-text-muted transition-colors hover:bg-background hover:text-danger disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <h2 className="flex min-w-0 flex-1 items-center gap-2 truncate leading-8 font-semibold text-text">
            {column.name}

            {column.is_done && (
              <div title="Column for dos that are done" className="cursor-help">
                <Flag className="size-3 text-text-muted" />
              </div>
            )}
          </h2>
        )}

        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-text-muted tabular-nums">
            {columnDos.length} {columnDos.length === 1 ? "do" : "dos"}
          </span>
        </div>

        {!showEditor && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Options for ${column.name}`}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex size-7 items-center justify-center text-text-muted transition-colors hover:bg-background hover:text-text"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute top-full right-0 z-20 mt-1 min-w-24 border border-border bg-card p-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleEdit}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-text transition-colors hover:bg-background"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>

                <button
                  type="button"
                  role="menuitem"
                  disabled={column.is_done}
                  onClick={() => setColumnIsDone(column.id, true)}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs whitespace-nowrap text-text transition-colors hover:bg-background disabled:cursor-not-allowed! disabled:text-text-muted! hover:disabled:bg-transparent"
                >
                  <Flag className="size-3" />
                  Set column as done
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-danger transition-colors hover:bg-danger-background"
                >
                  <Trash className="size-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
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
              onDragEnd={handleDoDragEnd}
              draggable={!isMoving && !showEditor}
              onDragStart={(event) => handleDoDragStart(event, doItem.id)}
              className={twMerge(
                "cursor-grab transition-opacity active:cursor-grabbing",
                isDragging && "opacity-40",
                isMoving && "pointer-events-none opacity-50",
              )}
            >
              <KanbanCard
                doItem={doItem}
                onEdit={handleEditDo}
                handleDragStart={handleDoDragStart}
                handleDragEnd={handleDoDragEnd}
                handleDragOver={handleDoDragOver}
                handleDragLeave={handleDoDragLeave}
                handleDrop={handleDoDrop}
                columnId={column.id}
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

        {/* Create new do button at bottom */}
        <button
          type="button"
          onClick={onCreateDoClick}
          disabled={!onCreateDoClick}
          className="mt-4 flex min-h-12 items-center justify-center border border-border bg-card px-3 text-xs font-medium text-text-muted transition-colors hover:bg-background hover:text-text disabled:opacity-50"
        >
          Create new do
        </button>
      </div>
    </article>
  );
};

export default KanbanColumn;