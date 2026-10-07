import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import { getCountdown, type Countdown } from "./getCountdown";

import Tag from "../../../tags/Tag";
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
        "min-w-0 bg-card p-2 hover:bg-card-hover md:p-1",
        hasEndDate
          ? "grid grid-cols-[minmax(0,1fr)_3ch_1ch_1ch_2ch_1ch_2ch] items-start"
          : "flex items-start",
        countdown.due && "bg-danger-background",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 pr-1">
        <span className="min-w-0 flex-1 text-xs wrap-break-word">
          {doItem.title}
        </span>

        <div className="flex w-full gap-1">
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: doItem.project_colour }}
              className="mt-0.5 size-2.5 shrink-0 rounded-xs border border-border"
            />
            <p className="text-[0.6875rem] leading-none text-text-muted">
              {doItem.project_name}
            </p>
          </div>

          {doItem.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {doItem.tags.map((tag) => (
                <Tag name={tag.name} colour={tag.colour} key={tag.id} />
              ))}
            </div>
          )}
        </div>
      </div>

      {hasEndDate && (
        <>
          <span className="min-w-[3ch] text-right text-[10px] text-text-muted tabular-nums">
            {!countdown.due && countdown.days > 0 ? `${countdown.days}d,` : ""}
          </span>

          <span className="min-w-[1ch] text-right text-[10px] text-text-muted tabular-nums">
            {!countdown.due ? countdown.hours : ""}
          </span>

          <span className="min-w-[1ch] text-center text-[10px] text-text-muted">
            {!countdown.due ? ":" : ""}
          </span>

          <span className="min-w-[2ch] text-right text-[10px] text-text-muted tabular-nums">
            {!countdown.due ? String(countdown.minutes).padStart(2, "0") : ""}
          </span>

          <span className="min-w-[1ch] text-center text-[10px] text-text-muted">
            {!countdown.due ? ":" : ""}
          </span>

          <span className="min-w-[2ch] text-right text-[10px] text-text-muted tabular-nums">
            {!countdown.due ? (
              String(countdown.seconds).padStart(2, "0")
            ) : (
              <span className="animate-pulse font-medium text-danger">Due</span>
            )}
          </span>
        </>
      )}
    </a>
  );
};
