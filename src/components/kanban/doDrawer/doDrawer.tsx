import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import { DateTimeField } from "../kanbanEditDrawer/libs/DateTimeField";
import type { DoDrawerProps, CreateDoData, KanbanDo, KanbanTag } from "./types";

type DoWithTags = KanbanDo & { tags?: { id: number }[] };

const formatDateTimeForInput = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const DoDrawer = ({
  doId,
  onClose,
  onCreate,
  onDelete,
  onUpdate,
  isCreating,
  createColumnId: initialCreateColumnId,
  tags: availableTags = [],
}: DoDrawerProps & { tags?: KanbanTag[] }) => {
  // Ensure we always have an array (not null/undefined)
  const tagsArray = Array.isArray(availableTags) ? availableTags : [];
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  // Fetch DO data (and its tags) when editing an existing task
  const fetchDoData = async (): Promise<DoWithTags | null> => {
    if (!doId || isCreating) return null;

    try {
      const response = await fetch(`/api/dos/${doId}`, { method: "GET" });
      if (!response.ok) return null;
      const data = (await response.json()) as { task?: DoWithTags };
      return data.task ?? null;
    } catch (err) {
      console.error("Failed to fetch DO:", err);
      return null;
    }
  };

  // Load task data on mount / when the target task changes
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (doId != null && !isCreating) {
        const task = await fetchDoData();
        if (cancelled) return;
        if (task) {
          setTitle(task.title || "");
          setDescription(task.description || "");
          setSelectedTagId(task.tags?.[0]?.id ?? null);
          setIsEditingMode(true);

          // Set datetime values for the DateTimeField components
          setStartAt(formatDateTimeForInput(task.start_at));
          setEndAt(formatDateTimeForInput(task.end_at));
        }
      } else {
        setSelectedTagId(null);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doId, isCreating]);



  // Prepare create/update data based on mode
  const prepareCreateData = (formData: CreateDoData): CreateDoData => {
    const tags = selectedTagId ? [{ id: selectedTagId }] : [];

    return {
      title: formData.title || "",
      description: formData.description ?? undefined,
      start_at: startAt || undefined,
      end_at: endAt || undefined,
      project_id: undefined,
      column_id: initialCreateColumnId ?? undefined,
      tags,
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

      const saveData = prepareCreateData({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      if (isCreating && onCreate) {
        // Create a new DO through the provided callback
        await onCreate(saveData);
        handleClose();
      } else if (doId != null) {
        // Update an existing DO via PATCH (never POST — that would duplicate)
        const response = await fetch(`/api/dos/${doId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveData),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Failed to update task");
        }

        // Close the drawer and use the newest edited information from the API response
        handleClose();

        const updatedData = (await response.json()) as { task?: DoWithTags };
        if (updatedData.task) {
          onUpdate?.(updatedData.task);
        }
        setTitle(updatedData.task?.title || "");
        setDescription(updatedData.task?.description || "");
        setSelectedTagId(updatedData.task?.tags?.[0]?.id ?? null);
        setStartAt(formatDateTimeForInput(updatedData.task?.start_at));
        setEndAt(formatDateTimeForInput(updatedData.task?.end_at));
      } else {
        // Create a new DO via POST (fallback when no callback is provided)
        const createResponse = await fetch("/api/dos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveData),
        });

        if (!createResponse.ok) {
          const data = (await createResponse.json()) as { error?: string };
          throw new Error(data.error || "Failed to create task");
        }

        const newData = (await createResponse.json()) as { task?: DoWithTags };
        setTitle(newData.task?.title || "");
        setDescription(newData.task?.description || "");
        setIsEditingMode(true);
      }

      setSaving(false);
    } catch (error) {
      console.error("Failed to save task:", error);
      setError((error as Error).message || "Failed to save task");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doId || isCreating) return;

    try {
      setDeleting(true);
      setError("");

      if (onDelete) {
        await onDelete(doId);
      } else {
        const response = await fetch(`/api/dos/${doId}`, { method: "DELETE" });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Failed to delete task");
        }
      }

      handleClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
      setError((error as Error).message || "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTitle("");
    setDescription("");
    setIsEditingMode(false);
    setSelectedTagId(null);
    setError("");
    setStartAt("");
    setEndAt("");
  };

  return (
    <div
      className={twMerge(
        "fixed inset-y-0 right-0 z-50",
        "flex w-full max-w-md flex-col",
        "border-l border-border bg-card",
        "shadow-2xl",
        "transition-transform duration-300 ease-out",
        doId !== null || isCreating ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="min-w-0">
          <p className="text-[1.5rem] tracking-wider text-text-muted uppercase">
            {isCreating ? "Create task" : isEditingMode ? "Edit task" : ""}
          </p>
          <h2 className="truncate text-[1.375rem] font-semibold text-text">{doId ? "Task" : ""}</h2>
        </div>

        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
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

            <DateTimeField label="Start" value={startAt} id="kanban-start" onChange={setStartAt} />
            <DateTimeField label="Due" value={endAt} id="kanban-end" onChange={setEndAt} />

            {tagsArray.length > 0 && (
              <div>
                <label htmlFor="kanban-tags" className="mb-1.5 block text-xs font-medium text-text-muted">Tags</label>
                <select
                  id="kanban-tags"
                  value={selectedTagId ?? ""}
                  className="w-full border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-text-muted"
                  onChange={(event) => {
                    const selectedTagId = Number(event.target.value);
                    setSelectedTagId(selectedTagId);
                  }}
                >
                  <option value="">No tag</option>
                  {tagsArray.map((tag) => (
                    <option
                      key={tag.id}
                      value={tag.id.toString()}
                      className="text-[0.625rem]"
                    >
                      {tag.name}
                    </option>
                  ))}

                  {!tagsArray.length && isEditingMode && (
                    <option disabled>No tags available</option>
                  )}
                </select>
              </div>
            )}

            {!tagsArray.length && isCreating && (
              <div className="text-xs text-text-muted">No tags available. Create some in the Tags page first.</div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete task"
              disabled={deleting || saving || doId === null}
              className="flex flex-1 items-center justify-center rounded border border-danger/30 bg-danger/5 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-40"
            >
              <X className="mr-2 size-3.5" />
              Delete
            </button>

            <button
              type="submit"
              disabled={saving}
              aria-label="Save task"
              className="flex flex-1 items-center justify-center rounded border border-text/70 bg-text/10 px-3 py-2 text-xs font-medium text-text hover:bg-text/20 disabled:opacity-40"
            >
              {saving ? "Saving..." : (isEditingMode ? "Update" : "Create")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DoDrawer;
