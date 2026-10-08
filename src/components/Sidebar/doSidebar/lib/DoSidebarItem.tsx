import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import Tag from "../../../tags/Tag";
import { getCountdown, type Countdown } from "./getCountdown";

import type { SidebarDo } from "../../contexts/SidebarContext";

export const DoSidebarItem = ({ doItem }: { doItem: SidebarDo }) => {
  const hasEndDate = doItem.end_at !== null;

  const [countdown, setCountdown] = useState<Countdown>(() =>
    getCountdown(doItem.end_at),
  );

  useEffect(() => {
    if (!doItem.end_at) return;

    setCountdown(getCountdown(doItem.end_at));

    const interval = setInterval(() => {
      setCountdown(getCountdown(doItem.end_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [doItem.end_at]);

  return (
    <a
      href={`?project_id=${doItem.project_id}&do_id=${doItem.id}`}
      className={twMerge(
        "flex min-w-0 items-start gap-2 bg-card p-2 hover:bg-card-hover md:p-1",
        countdown.due && "bg-danger-background",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <div className="flex w-full min-w-0 items-start justify-between gap-2">
          <span className="min-w-0 flex-1 text-xs wrap-break-word">
            {doItem.title}
          </span>

          {hasEndDate && (
            <span
              className={twMerge(
                "shrink-0 rounded-xs bg-background px-1.5 py-0.5 text-[10px] leading-none tabular-nums",
                countdown.due ? "text-danger" : "text-text-muted",
              )}
            >
              {countdown.due ? (
                <span className="animate-pulse font-medium">Due</span>
              ) : (
                formatCountdown(countdown)
              )}
            </span>
          )}
        </div>

        <div className="flex w-full min-w-0 items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              style={{ backgroundColor: doItem.project_colour }}
              className="mt-0.5 size-2.5 shrink-0 rounded-xs border border-border"
            />

            <p className="truncate text-[0.6875rem] leading-none text-text-muted">
              {doItem.project_name}
            </p>
          </div>

          {doItem.tags?.length > 0 && (
            <div className="flex min-w-0 flex-wrap gap-1">
              {doItem.tags.map((tag) => (
                <Tag
                  key={tag.id}
                  name={tag.name}
                  colour={tag.colour}
                  className="px-1 py-0.5 text-[0.625rem] leading-none"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </a>
  );
};

const formatCountdown = (countdown: Countdown) => {
  const time = [
    String(countdown.hours).padStart(2, "0"),
    String(countdown.minutes).padStart(2, "0"),
    String(countdown.seconds).padStart(2, "0"),
  ].join(":");

  return countdown.days > 0 ? `${countdown.days}d ${time}` : time;
};
