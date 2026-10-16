import { useEffect, useState } from "react";

import type { RecurrenceInput } from '../types';
import type { CreateDoData, DoDrawerProps, KanbanDo } from '../types';

type DoWithTags = KanbanDo & {
  tags?: { id: number; name?: string; colour?: string }[];
  recurrence?: RecurrenceInput | null;
};

const formatDateTimeForInput = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const useDoDrawer = ({
  doId,
  onClose,
  onCreate,
  onDelete,
  onUpdate,
  isCreating,
  createColumnId,
}: Pick<
  DoDrawerProps,
  | "doId"
  | "onClose"
  | "onCreate"
  | "onDelete"
  | "onUpdate"
  | "isCreating"
  | "createColumnId"
>) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([]);
  const [recurrenceStartDate, setRecurrenceStartDate] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);

  const reset = () => {
    setTitle("");
    setDescription("");
    setIsEditingMode(false);
    setSelectedTagId(null);
    setStartAt("");
    setEndAt("");
    setError("");
    setRecurrenceEnabled(false);
    setRecurrenceWeekdays([]);
    setRecurrenceStartDate("");
    setRecurrenceEndDate("");
    setRecurrenceInterval(1);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (doId == null || isCreating) {
        reset();
        return;
      }
      try {
        const response = await fetch(`/api/dos/${doId}`);
        if (!response.ok) throw new Error("Failed to load task");
        const data = (await response.json()) as { task?: DoWithTags };
        if (cancelled || !data.task) return;
        setTitle(data.task.title || "");
        setDescription(data.task.description || "");
        setSelectedTagId(data.task.tags?.[0]?.id ?? null);
        setStartAt(formatDateTimeForInput(data.task.start_at));
        setEndAt(formatDateTimeForInput(data.task.end_at));
        const recurrence = data.task.recurrence;
        setRecurrenceEnabled(Boolean(recurrence?.is_active));
        setRecurrenceWeekdays(recurrence?.weekdays ?? []);
        setRecurrenceStartDate(recurrence?.start_date ?? "");
        setRecurrenceEndDate(recurrence?.end_date ?? "");
        setRecurrenceInterval(recurrence?.interval_weeks ?? 1);
        setIsEditingMode(true);
        setError("");
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [doId, isCreating]);

  const buildData = (): CreateDoData => ({
    title: title.trim(),
    description: description.trim() || undefined,
    start_at: startAt || undefined,
    end_at: endAt || undefined,
    column_id: createColumnId,
    tags: selectedTagId ? [{ id: selectedTagId }] : [],
    recurrence: recurrenceEnabled
      ? {
          weekdays: recurrenceWeekdays,
          start_date: recurrenceStartDate,
          end_date: recurrenceEndDate || null,
          interval_weeks: recurrenceInterval,
          is_active: true,
        }
      : null,
  });

  const handleSave = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saveData = buildData();
      if (isCreating && onCreate) {
        await onCreate(saveData);
      } else if (doId != null) {
        const response = await fetch(`/api/dos/${doId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveData),
        });
        const data = (await response.json()) as {
          error?: string;
          task?: DoWithTags;
        };
        if (!response.ok)
          throw new Error(data.error || "Failed to update task");
        if (data.task) onUpdate?.(data.task);
        onClose();
      } else {
        const response = await fetch("/api/dos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveData),
        });
        if (!response.ok) throw new Error("Failed to create task");
        setIsEditingMode(true);
      }
    } catch (saveError) {
      setError((saveError as Error).message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doId || isCreating) return;
    setDeleting(true);
    setError("");
    try {
      if (onDelete) await onDelete(doId);
      else {
        const response = await fetch(`/api/dos/${doId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete task");
      }
      onClose();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return {
    saving,
    deleting,
    error,
    title,
    setTitle,
    description,
    setDescription,
    isEditingMode,
    selectedTagId,
    setSelectedTagId,
    startAt,
    setStartAt,
    endAt,
    setEndAt,
    recurrenceEnabled,
    setRecurrenceEnabled,
    recurrenceWeekdays,
    setRecurrenceWeekdays,
    recurrenceStartDate,
    setRecurrenceStartDate,
    recurrenceEndDate,
    setRecurrenceEndDate,
    recurrenceInterval,
    setRecurrenceInterval,
    handleSave,
    handleDelete,
    handleClose,
  };
};
