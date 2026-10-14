import { twMerge } from "tailwind-merge";
import { useEffect, useRef, useState } from "react";
import { Check, Flag, MoreHorizontal, Pencil, Trash, X } from "lucide-react";

import type { Column } from "../../db";

import KanbanCard from "./KanbanCard";
import { useKanban } from "./contexts";

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
    dragOverCardId,
    dropBeforeCard,
    movingDoId,
    handleDragStart: handleDoDragStart,
    handleDragEnd: handleDoDragEnd,
    handleDragOver: handleDoDragOver,
    handleDragLeave: handleDoDragLeave,
    handleDrop: handleDoDrop,
    handleSaveColumn,
    handleDeleteColumn,
    handleDropColumn,
    setDraggedColumnId,
    draggedColumnId,
    setDragOverColumnForReorder,
    dragOverColumnForReorder,
  } = useKanban();

  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState(column.name);
  const [saving, setSaving] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingColumnId === column.id;
  // Safety check for dos - prevents "Cannot read properties of undefined (reading 'filter')"
  const columnDos = Array.isArray(dos)
    ? dos
        .filter((doItem) => doItem.column_id === column.id)
        .sort((a, b) => a.position - b.position)
    : [];
  const isDragOver = dragOverColumnId === column.id;
  const isColumnDragOver = dragOverColumnForReorder === column.id;

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
    if (column.id < 0) {
      setEditingColumnLocal(true);
    }

    if (!isEditing) return;

    setName(column.name);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isEditing, column.name]);

  const [editingColumnLocal, setEditingColumnLocal] = useState(column.id < 0);

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

  // Use local editing state or context editing state
  const showEditor = editingColumnLocal || isEditing;

  return (
    <article
      onDragLeave={(event) => handleDoDragLeave(event)}
      onDragEnd={() => {
        setDraggedColumnId(null);
        setDragOverColumnForReorder(null);
      }}
      className={twMerge(
        "min-w-0 border border-border bg-card p-2 transition-colors",
        (isDragOver || isColumnDragOver) && "border-green-500 bg-green-500/5",
        draggedColumnId === column.id && "opacity-50",
      )}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("application/x-kanban-column")) {
          event.preventDefault();
          setDragOverColumnForReorder(column.id);
        } else {
          handleDoDragOver(event, column.id);
        }
      }}
      onDrop={(event) => {
        if (event.dataTransfer.types.includes("application/x-kanban-column")) {
          void handleDropColumn(event, column.id);
          return;
        }
        // Only handle DO drops here, not column reordering
        const droppedDoId = Number(event.dataTransfer.getData("text/plain"));
        if (!droppedDoId) return;
        event.stopPropagation();
        void handleDoDrop(event, column.id);
      }}
    >
      <div
        draggable={!showEditor}
        data-column-drag-handle
        onDragStart={(event) => {
          setDraggedColumnId(column.id);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("application/x-kanban-column", String(column.id));
        }}
        onDragEnd={() => { setDraggedColumnId(null); setDragOverColumnForReorder(null); }}
        className="flex items-center justify-between gap-2"
      >
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
            <div key={doItem.id} className="relative">
              {draggedDoId !== doItem.id &&
                dragOverCardId === doItem.id &&
                dropBeforeCard && (
                  <div className="pointer-events-none absolute -top-1.5 right-0 left-0 z-10 h-1 rounded bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.25)]" />
                )}
              <KanbanCard
                doItem={doItem}
                columnId={column.id}
                isDragging={isDragging}
                onEdit={handleEditDo}
                handleDrop={handleDoDrop}
                handleDragEnd={handleDoDragEnd}
                handleDragOver={handleDoDragOver}
                handleDragStart={handleDoDragStart}
                handleDragLeave={handleDoDragLeave}
                className={twMerge(
                  "transition-opacity",
                  isDragging && "opacity-40",
                  isMoving && "pointer-events-none opacity-50",
                  Number(doId) === doItem.id && "border border-green-500",
                )}
              />
              {draggedDoId !== doItem.id &&
                dragOverCardId === doItem.id &&
                !dropBeforeCard && (
                  <div className="pointer-events-none absolute right-0 -bottom-1.5 left-0 z-10 h-1 rounded bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.25)]" />
                )}
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
