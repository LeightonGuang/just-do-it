import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useDoDrawer } from "./hooks/useDoDrawer";
import type { DoDrawerProps, KanbanTag } from "./types";
import { DateTimeField } from "../kanbanEditDrawer/libs/DateTimeField";

const DoDrawer = ({
  tags: availableTags = [],
  ...props
}: DoDrawerProps & { tags?: KanbanTag[] }) => {
  const tags = Array.isArray(availableTags) ? availableTags : [];
  const drawer = useDoDrawer(props);
  const isOpen = props.doId !== null || props.isCreating;

  return (
    <div
      className={twMerge(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="min-w-0">
          <p className="tracking-wider text-text-muted uppercase">
            {props.isCreating
              ? "Create task"
              : drawer.isEditingMode
                ? "Edit task"
                : ""}
          </p>
          <h2 className="truncate text-[1.375rem] font-semibold text-text">
            {props.doId ? "Task" : ""}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={drawer.handleClose}
          className="flex justify-center p-1 text-text-muted hover:text-text"
        >
          <X className="size-4" />
        </button>
      </div>

      <form
        onSubmit={drawer.handleSave}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-5">
            {drawer.error && (
              <div className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {drawer.error}
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
                id="kanban-title"
                value={drawer.title}
                placeholder="Task title"
                onChange={(event) => drawer.setTitle(event.target.value)}
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
                id="kanban-description"
                value={drawer.description}
                placeholder="Add a description..."
                onChange={(event) => drawer.setDescription(event.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm leading-relaxed text-text outline-none focus:border-text-muted"
              />
            </div>
            <DateTimeField
              label="Start"
              id="kanban-start"
              value={drawer.startAt}
              onChange={drawer.setStartAt}
            />

            <DateTimeField
              label="Due"
              id="kanban-end"
              value={drawer.endAt}
              onChange={drawer.setEndAt}
            />
            {tags.length > 0 && (
              <div>
                <label
                  htmlFor="kanban-tags"
                  className="mb-1.5 block text-xs font-medium text-text-muted"
                >
                  Tags
                </label>
                <select
                  id="kanban-tags"
                  value={drawer.selectedTagId ?? ""}
                  onChange={(event) =>
                    drawer.setSelectedTagId(Number(event.target.value) || null)
                  }
                  className="w-full border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-text-muted"
                >
                  <option value="">No tag</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {tags.length === 0 && props.isCreating && (
              <div className="text-xs text-text-muted">
                No tags available. Create some in the Tags page first.
              </div>
            )}

            <div className="border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={drawer.recurrenceEnabled}
                  onChange={(e) =>
                    drawer.setRecurrenceEnabled(e.target.checked)
                  }
                />
                Repeat this task
              </label>
              {drawer.recurrenceEnabled && (
                <div className="mt-3 space-y-3">
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-text-muted">
                      Days
                    </span>
                    <div className="grid grid-cols-7 gap-1">
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                        <button
                          type="button"
                          key={`${day}-${i}`}
                          className={twMerge(
                            "border px-1 py-2 text-xs",
                            drawer.recurrenceWeekdays.includes(i + 1)
                              ? "border-text bg-text/10"
                              : "border-border",
                          )}
                          onClick={() =>
                            drawer.setRecurrenceWeekdays(
                              drawer.recurrenceWeekdays.includes(i + 1)
                                ? drawer.recurrenceWeekdays.filter(
                                    (d) => d !== i + 1,
                                  )
                                : [...drawer.recurrenceWeekdays, i + 1],
                            )
                          }
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block text-xs text-text-muted">
                    Every{" "}
                    <select
                      value={drawer.recurrenceInterval}
                      onChange={(e) =>
                        drawer.setRecurrenceInterval(Number(e.target.value))
                      }
                      className="ml-2 border border-border bg-background px-2 py-1 text-text"
                    >
                      <option value="1">week</option>
                      <option value="2">2 weeks</option>
                      <option value="3">3 weeks</option>
                      <option value="4">4 weeks</option>
                    </select>
                  </label>
                  <label className="block text-xs text-text-muted">
                    Start date{" "}
                    <input
                      type="date"
                      value={drawer.recurrenceStartDate}
                      onChange={(e) =>
                        drawer.setRecurrenceStartDate(e.target.value)
                      }
                      className="ml-2 border border-border bg-background px-2 py-1 text-text"
                    />
                  </label>
                  <label className="block text-xs text-text-muted">
                    End date{" "}
                    <input
                      type="date"
                      value={drawer.recurrenceEndDate}
                      onChange={(e) =>
                        drawer.setRecurrenceEndDate(e.target.value)
                      }
                      className="ml-2 border border-border bg-background px-2 py-1 text-text"
                    />
                    <span className="ml-2">blank = indefinitely</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-border p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Delete task"
              onClick={drawer.handleDelete}
              disabled={drawer.deleting || drawer.saving || props.doId === null}
              className="flex flex-1 items-center justify-center rounded border border-danger/30 bg-danger/5 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-40"
            >
              <X className="mr-2 size-3.5" />
              Delete
            </button>
            <button
              type="submit"
              aria-label="Save task"
              disabled={drawer.saving}
              className="flex flex-1 items-center justify-center rounded border border-border bg-text/10 px-3 py-2 text-xs font-medium text-text hover:bg-text/20 disabled:opacity-40"
            >
              {drawer.saving
                ? "Saving..."
                : drawer.isEditingMode
                  ? "Update"
                  : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DoDrawer;
