import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import type { DoDrawerProps } from "./types";
import { DateTimeField } from "../kanbanEditDrawer/libs/DateTimeField";
import { formatDateForApi } from "../kanbanEditDrawer/libs/formatDateForApi";

const KanbanEditDrawer = ({ doId, onClose, onCreate }: DoDrawerProps) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (doId === null) {
      setTitle("");
      setDescription("");
      setError("");
    }
  }, [doId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && doId === null) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    if (doId !== null) {
      document.body.style.overflow = "";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [doId, onClose]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (onCreate) {
        await onCreate({
          title: title.trim(),
          description: description.trim() || undefined,
          project_id: 1,
          column_id: 1, // Will be set by parent
        });
      }

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doId) return;

    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`/api/dos/${doId}`, { method: "DELETE" });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete task");
      }

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={twMerge(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-300",
          doId !== null ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-hidden={doId === null}
        className={twMerge(
          "fixed inset-y-0 right-0 z-50",
          "flex w-full max-w-md flex-col",
          "border-l border-border bg-card",
          "shadow-2xl",
          "transition-transform duration-300 ease-out",
          doId !== null ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="min-w-0">
            <p className="text-xs tracking-wider text-text-muted uppercase">Edit task</p>
            <h2 className="truncate text-sm font-semibold text-text">{doId ? "Task" : ""}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex justify-center p-1 text-text-muted transition-colors hover:text-text"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              {error && (
                <div className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>
              )}

              <div>
                <label htmlFor="kanban-title" className="mb-1.5 block text-xs font-medium text-text-muted">Title</label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  id="kanban-title"
                  placeholder="Task title"
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-text-muted"
                />
              </div>

              <div>
                <label htmlFor="kanban-description" className="mb-1.5 block text-xs font-medium text-text-muted">Description</label>
                <textarea
                  rows={5}
                  value={description}
                  id="kanban-description"
                  placeholder="Add a description..."
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full border border-border bg-background px-3 py-2 text-sm leading-relaxed text-text outline-none focus:border-text-muted"
                />
              </div>

              <DateTimeField label="Start" value="" id="kanban-start" onChange={() => {}} />
              <DateTimeField label="Due" value="" id="kanban-end" onChange={() => {}} />
            </div>
          </div>

          <div className="shrink-0 border-t border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="px-2 py-2 text-sm text-danger transition-colors hover:text-danger/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving || deleting}
                  className="border border-border px-4 py-2 text-sm text-text transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!title.trim() || saving || deleting}
                  className="bg-text px-4 py-2 text-sm text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </aside>
    </>
  );
};

export default KanbanEditDrawer;