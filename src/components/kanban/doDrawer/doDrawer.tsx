import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import type { DoDrawerProps, CreateDoData, KanbanDo } from "./types";
import { DateTimeField } from "../kanbanEditDrawer/libs/DateTimeField";
import { formatDateForApi } from "../kanbanEditDrawer/libs/formatDateForApi";

const DoDrawer = ({ doId, onClose, onCreate, isCreating }: DoDrawerProps) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Fetch DO data when switching to edit mode
  const fetchDoData = async () => {
    if (!doId || isCreating) return null;

    try {
      const response = await fetch(`/api/dos/${doId}`, { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        setDoData(data);
        setIsEditingMode(true);
      }
    } catch (err) {
      console.error("Failed to fetch DO:", err);
    }
  };

  // Populate form with existing DO data when entering edit mode
  const [doData, setDoData] = useState<KanbanDo | null>(null);

  useEffect(() => {
    if (doId !== null && !isCreating) {
      setTitle(""); // Clear title first
      setDescription("");
      setError("");

      fetchDoData().then((data) => {
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
        }
      });
    } else {
      setDoData(null);
      setIsEditingMode(false);
    }
  }, [doId, isCreating]);

  // Prepare create/update data based on mode
  const prepareCreateData = (formData: CreateDoData): CreateDoData => {
    if (isEditingMode && doData) {
      return {
        ...formData,
        id: doData.id,
        project_id: doData.project_id,
        column_id: doData.column_id,
      };
    }

    return {
      ...formData,
      project_id: isCreating ? 1 : doData?.project_id,
      column_id: createColumnId || isCreating ? 1 : doData?.column_id,
    };
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Call create or update based on mode
      if (onCreate) {
        await onCreate(prepareCreateData({
          title: title.trim(),
          description: description.trim() || undefined,
        }));
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
            <p className="text-xs tracking-wider text-text-muted uppercase">
              {isCreating ? "Create task" : isEditingMode ? "Edit task" : ""}
            </p>
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
                disabled={deleting || saving || doId === null}
                aria-label="Delete task"
                className="flex flex-1 items-center justify-center rounded border border-danger/30 bg-danger/5 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-40"
              >
                <X className="mr-2 size-3.5" />
                Delete
              </button>

              <button
                type="submit"
                onClick={() => {}}
                aria-label="Save task"
                disabled={saving}
                className="flex flex-1 items-center justify-center rounded bg-text text-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-text-muted disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </>
  );
};

export default DoDrawer;