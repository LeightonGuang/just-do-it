import { useEffect, useState } from "react";

import type { ApiDo } from "./master-control/commands/types";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  due: boolean;
};

const KanbanCard = ({
  className,
  doItem,
}: {
  className?: string;
  doItem: ApiDo;
}) => {
  const [countdown, setCountdown] = useState<Countdown>(() =>
    getCountdown(doItem.end_at),
  );

  useEffect(() => {
    if (!doItem.end_at) {
      return;
    }

    setCountdown(getCountdown(doItem.end_at));

    const interval = setInterval(() => {
      setCountdown(getCountdown(doItem.end_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [doItem.end_at]);

  const hasStart = Boolean(doItem.start_at);
  const hasEnd = Boolean(doItem.end_at);

  return (
    <div
      className={`border border-border bg-do p-3 transition-colors hover:cursor-grab hover:bg-do-hover active:cursor-grabbing ${className ?? ""}`}
    >
      <p className="text-sm font-medium text-text">{doItem.title}</p>

      {doItem.description && (
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          {doItem.description}
        </p>
      )}

      {(hasStart || hasEnd) && (
        <div className="mt-3 border-t border-border pt-2">
          {/* Dates */}
          <div className="flex min-w-0 items-center gap-2 text-xs">
            {hasStart && (
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="size-1.5 shrink-0 rounded-full bg-text-muted" />

                <span className="shrink-0 text-text-muted">Start</span>

                <span className="truncate text-text">
                  {formatDate(doItem.start_at)}
                </span>
              </div>
            )}

            {hasStart && hasEnd && (
              <span className="shrink-0 text-text-muted">→</span>
            )}

            {hasEnd && (
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${
                    countdown.due ? "bg-danger" : "bg-text-muted"
                  }`}
                />

                <span className="shrink-0 text-text-muted">End</span>

                <span className="truncate text-text">
                  {formatDate(doItem.end_at)}
                </span>
              </div>
            )}
          </div>

          {/* Countdown */}
          {hasEnd && (
            <div
              className={`mt-1.5 flex justify-end text-xs tabular-nums ${
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

const formatDate = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  const dateString = `${day}-${month}-${year}`;

  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;

  if (!hasTime) {
    return dateString;
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${dateString} ${hours}:${minutes}`;
};

const formatCountdown = (countdown: Countdown) => {
  const parts: string[] = [];

  if (countdown.days > 0) {
    parts.push(`${countdown.days}d`);
  }

  parts.push(
    `${String(countdown.hours).padStart(2, "0")}:${String(
      countdown.minutes,
    ).padStart(2, "0")}:${String(countdown.seconds).padStart(2, "0")}`,
  );

  return parts.join(" ");
};

const getCountdown = (endAt: string | null): Countdown => {
  if (!endAt) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      due: false,
    };
  }

  const endDate = new Date(endAt);

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
