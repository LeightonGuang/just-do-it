import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import { X } from "lucide-react";

import { useKanban } from "../contexts/KanbanContext";

type KanbanEditDrawerProps = {
  doId: number | null;
  onClose: () => void;
};

type DateTimeFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type FormValues = {
  title: string;
  description: string;
  columnId: string;
  startAt: string;
  endAt: string;
};

const KanbanEditDrawer = ({ doId, onClose }: KanbanEditDrawerProps) => {
  const { dos, columns, projectId, fetchKanban } = useKanban();

  const doItem = dos.find((item) => item.id === doId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [initialValues, setInitialValues] = useState<FormValues>({
    title: "",
    description: "",
    columnId: "",
    startAt: "",
    endAt: "",
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isOpen = doId !== null;

  useEffect(() => {
    if (!doItem) {
      const emptyValues: FormValues = {
        title: "",
        description: "",
        columnId: "",
        startAt: "",
        endAt: "",
      };

      setTitle("");
      setDescription("");
      setColumnId("");
      setStartAt("");
      setEndAt("");
      setInitialValues(emptyValues);
      setError("");

      return;
    }

    const values: FormValues = {
      title: doItem.title ?? "",
      description: doItem.description ?? "",
      columnId: String(doItem.column_id ?? ""),
      startAt: toDatetimeLocal(doItem.start_at),
      endAt: toDatetimeLocal(doItem.end_at),
    };

    setTitle(values.title);
    setDescription(values.description);
    setColumnId(values.columnId);
    setStartAt(values.startAt);
    setEndAt(values.endAt);
    setInitialValues(values);
    setError("");
  }, [doItem]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const currentValues: FormValues = {
    title,
    description,
    columnId,
    startAt,
    endAt,
  };

  const hasChanges =
    currentValues.title !== initialValues.title ||
    currentValues.description !== initialValues.description ||
    currentValues.columnId !== initialValues.columnId ||
    currentValues.startAt !== initialValues.startAt ||
    currentValues.endAt !== initialValues.endAt;

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!doItem || !hasChanges) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }

    if (!columnId) {
      setError("Column is required");
      return;
    }

    if (
      startAt &&
      endAt &&
      new Date(startAt).getTime() > new Date(endAt).getTime()
    ) {
      setError("Start time must be before end time");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/dos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: doItem.id,
          title: trimmedTitle,
          description: description.trim() || null,
          column_id: Number(columnId),
          project_id: projectId ? Number(projectId) : undefined,
          start_at: startAt ? formatDateForApi(startAt) : null,
          end_at: endAt ? formatDateForApi(endAt) : null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(data?.error || "Failed to save task");
      }

      await fetchKanban();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doItem) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`/api/dos/${doItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(data?.error || "Failed to delete task");
      }

      await fetchKanban();
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete task",
      );
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
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-hidden={!isOpen}
        className={twMerge(
          "fixed inset-y-0 right-0 z-50",
          "flex w-full max-w-md flex-col",
          "border-l border-border bg-card",
          "shadow-2xl",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="min-w-0">
            <p className="text-xs tracking-wider text-text-muted uppercase">
              Edit task
            </p>

            <h2 className="truncate text-sm font-semibold text-text">
              {doItem?.title || "Task"}
            </h2>
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
                <div className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="kanban-title"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Title
                </label>

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
                <label
                  htmlFor="kanban-description"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Description
                </label>

                <textarea
                  rows={5}
                  value={description}
                  id="kanban-description"
                  placeholder="Add a description..."
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full border border-border bg-background px-3 py-2 text-sm leading-relaxed text-text outline-none focus:border-text-muted"
                />
              </div>

              <div>
                <label
                  htmlFor="kanban-column"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Column
                </label>

                <select
                  value={columnId}
                  id="kanban-column"
                  onChange={(event) => setColumnId(event.target.value)}
                  className="w-full border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-text-muted"
                >
                  <option value="" disabled>
                    Select a column
                  </option>

                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>

              <DateTimeField
                label="Start"
                value={startAt}
                id="kanban-start"
                onChange={setStartAt}
              />

              <DateTimeField
                label="Due"
                value={endAt}
                id="kanban-end"
                onChange={setEndAt}
              />
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
                  disabled={!hasChanges || saving || deleting}
                  className="bg-text px-4 py-2 text-sm text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed! disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </aside>
    </>
  );
};

const DateTimeField = ({ id, label, value, onChange }: DateTimeFieldProps) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-text-muted"
      >
        {label}
      </label>

      <div className="flex gap-2">
        <input
          id={id}
          value={value}
          type="datetime-local"
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-text-muted"
        />

        <button
          type="button"
          disabled={!value}
          onClick={() => onChange("")}
          className="shrink-0 border border-danger-border px-3 text-xs text-danger transition-colors hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:text-text disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

const toDatetimeLocal = (value: string | Date | null | undefined) => {
  if (!value) return "";

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateForApi = (value: string) => {
  const [datePart, timePart] = value.split("T");

  if (!datePart) return "";

  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) return "";

  if (!timePart) {
    return `${Number(day)}-${Number(month)}-${Number(year)}`;
  }

  return `${Number(day)}-${Number(month)}-${Number(year)} ${timePart}`;
};

export default KanbanEditDrawer;
