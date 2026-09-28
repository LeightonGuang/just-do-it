import { twMerge } from "tailwind-merge";
import { useEffect, useRef, useState } from "react";
import { Check, MoreHorizontal, Pencil, Trash, X } from 'lucide-react';

import type { Column, Do } from "../../db/schema";

import KanbanCard from "./KanbanCard";

type KanbanColumnProps = {
  column: Column;
  dos: Do[];
  doId: string | null;

  draggedDoId: number | null;
  dragOverColumnId: number | null;
  movingDoId: number | null;

  editingColumnId: number | null;

  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    id: number,
  ) => void;

  onDragEnd: () => void;

  onDragOver: (
    event: React.DragEvent<HTMLElement>,
    columnId: number,
  ) => void;

  onDragLeave: (
    event: React.DragEvent<HTMLElement>,
  ) => void;

  onDrop: (
    event: React.DragEvent<HTMLElement>,
    columnId: number,
  ) => void;

  onEditDo: (id: number) => void;
  onEditColumn: (id: number) => void;
  onSaveColumn: (id: number, name: string) => Promise<void>;
  onCloseColumnEditor: () => void;
  onDeleteColumn: (id: number) => void;
};

const KanbanColumn = ({
  column,
  dos,
  doId,

  draggedDoId,
  dragOverColumnId,
  movingDoId,

  editingColumnId,

  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,

  onEditDo,
  onEditColumn,
  onSaveColumn,
  onCloseColumnEditor,
  onDeleteColumn,
}: KanbanColumnProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState(column.name);
  const [saving, setSaving] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingColumnId === column.id;

  const columnDos = dos.filter(
    (doItem) => doItem.column_id === column.id,
  );

  const isDragOver = dragOverColumnId === column.id;

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!isEditing) return;

    setName(column.name);

    // Focus after the input has rendered.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isEditing, column.name]);

  const handleEdit = () => {
    setMenuOpen(false);
    onEditColumn(column.id);
  };

  const handleDelete = async () => {
    setMenuOpen(false);

    await onDeleteColumn(column.id);
  };

  const handleCancelEdit = () => {
    setName(column.name);
    onCloseColumnEditor();
  };

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || saving) return;

    if (trimmedName === column.name) {
      onCloseColumnEditor();
      return;
    }

    try {
      setSaving(true);

      await onSaveColumn(column.id, trimmedName);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSave();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <article
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, column.id)}
      onDragOver={(event) => onDragOver(event, column.id)}
      className={twMerge(
        "min-w-0 border border-border bg-card p-2 transition-colors",
        isDragOver &&
          "border-green-500 bg-green-500/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input
              type="text"
              value={name}
              ref={inputRef}
              disabled={saving}
              onKeyDown={handleKeyDown}
              onChange={(event) =>
                setName(event.target.value)
              }
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
          <h2 className="min-w-0 flex-1 truncate leading-8 font-semibold text-text">
            {column.name}
          </h2>
        )}

        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-text-muted tabular-nums">
            {columnDos.length}{" "}
            {columnDos.length === 1 ? "do" : "dos"}
          </span>

          {!isEditing && (
            <div
              ref={menuRef}
              className="relative"
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={`Options for ${column.name}`}
                onClick={() =>
                  setMenuOpen((open) => !open)
                }
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
                    className="flex w-full items-center gap-1 px-2 py-1.5 text-left text-xs text-text transition-colors hover:bg-background"
                  >
                    <Pencil className="size-3" />
                    Edit
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-1 px-2 py-1.5 text-left text-xs text-danger transition-colors hover:bg-danger-background"
                  >
                    <Trash className="size-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className={twMerge(
          "mt-4 flex min-h-20 flex-col gap-2 rounded",
          isDragOver && "bg-green-500/5",
        )}
      >
        {columnDos.map((doItem) => {
          const isDragging =
            draggedDoId === doItem.id;

          const isMoving =
            movingDoId === doItem.id;

          return (
            <div
              key={doItem.id}
              onDragEnd={onDragEnd}
              draggable={!isMoving && !isEditing}
              onDragStart={(event) =>
                onDragStart(event, doItem.id)
              }
              className={twMerge(
                "cursor-grab transition-opacity active:cursor-grabbing",
                isDragging && "opacity-40",
                isMoving &&
                  "pointer-events-none opacity-50",
              )}
            >
              <KanbanCard
                doItem={doItem}
                onClick={() =>
                  onEditDo(doItem.id)
                }
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
            {isDragOver
              ? "Drop here"
              : "No cards"}
          </div>
        )}
      </div>
    </article>
  );
};

export default KanbanColumn;
