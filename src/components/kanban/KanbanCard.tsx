import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import type { Do } from "../../db/schema";
import type { ApiDo } from "../master-control/commands/types";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  due: boolean;
};

type KanbanCardProps = {
  className?: string;
  doItem: ApiDo | Do;
  onEdit: (id: number) => void;
};

const KanbanCard = ({ className, doItem, onEdit }: KanbanCardProps) => {
  const [countdown, setCountdown] = useState<Countdown>(() =>
    getCountdown(doItem.end_at),
  );

  useEffect(() => {
    if (!doItem.end_at) {
      return;
    }

    const updateCountdown = () => {
      setCountdown(getCountdown(doItem.end_at));
    };

    updateCountdown();

    const interval = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(interval);
  }, [doItem.end_at]);

  const hasStart = Boolean(doItem.start_at);
  const hasEnd = Boolean(doItem.end_at);

  return (
    <div
      className={twMerge(
        "border border-border bg-do p-3 transition-colors hover:cursor-grab hover:bg-do-hover active:cursor-grabbing",
        className,
      )}
    >
      {/* Title */}
      <p
        onClick={(event) => {
          event.stopPropagation();
          onEdit(doItem.id);
        }}
        className="w-fit text-sm font-medium text-text hover:cursor-pointer hover:underline"
      >
        {doItem.title}
      </p>

      {/* Description */}
      {doItem.description && (
        <p className="mt-1 line-clamp-3 text-xs leading-snug text-text-muted">
          {doItem.description}
        </p>
      )}

      {/* Dates */}
      {(hasStart || hasEnd) && (
        <div className="mt-3 border-t border-border pt-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {hasStart && (
              <span className="truncate text-text">
                {formatDate(doItem.start_at)}
              </span>
            )}

            {hasStart && hasEnd && (
              <span className="shrink-0 text-text-muted">→</span>
            )}

            {hasEnd && (
              <span className="truncate text-text">
                {formatDate(doItem.end_at)}
              </span>
            )}
          </div>

          {/* Countdown */}
          {hasEnd && (
            <div
              className={`mt-1.5 text-right text-xs tabular-nums ${
                countdown.due ? "text-danger" : "text-text-muted"
              }`}
            >
              {countdown.due ? (
                <span className="animate-pulse font-medium">Due</span>
              ) : (
                <span>{formatCountdown(countdown)}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "";

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  const dateString = `${day}/${month}/${year}`;

  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;

  if (!hasTime) return dateString;

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${dateString} ${hours}:${minutes}`;
};

const formatCountdown = (countdown: Countdown) => {
  const parts: string[] = [];

  if (countdown.days > 0) parts.push(`${countdown.days}d`);

  parts.push(
    `${String(countdown.hours).padStart(2, "0")}:${String(
      countdown.minutes,
    ).padStart(2, "0")}:${String(countdown.seconds).padStart(2, "0")}`,
  );

  return parts.join(" ");
};

const getCountdown = (endAt: string | Date | null | undefined): Countdown => {
  if (!endAt) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      due: false,
    };
  }

  const endDate = typeof endAt === "string" ? new Date(endAt) : endAt;

  if (Number.isNaN(endDate.getTime())) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      due: false,
    };
  }

  const diff = endDate.getTime() - Date.now();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      due: true,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    due: false,
  };
};

export default KanbanCard;
