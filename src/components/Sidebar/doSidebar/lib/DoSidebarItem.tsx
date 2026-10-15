import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import Tag from "../../../tags/Tag";
import { useTheme } from "../../../../hooks/useTheme";
import { getCountdown, type Countdown } from "./getCountdown";

import type { Theme } from "../../../../types/Theme";
import type { SidebarDo } from "../../contexts/SidebarContext";

export const DoSidebarItem = ({ doItem }: { doItem: SidebarDo }) => {
  const theme: Theme = useTheme();
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    window.history.pushState(
      {},
      "",
      `/?project_id=${doItem.project_id}&do_id=${doItem.id}`,
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const hasEndDate = Boolean(doItem.end_at);

  // Only initialize countdown state when there's an end date
  const [countdown, setCountdown] = useState<Countdown>(() =>
    hasEndDate
      ? getCountdown(doItem.end_at)
      : { days: 0, hours: 0, minutes: 0, seconds: 0, due: false },
  );

  // Only update countdown when there's an end date
  useEffect(() => {
    if (!hasEndDate) return;

    setCountdown(getCountdown(doItem.end_at));

    const interval = setInterval(() => {
      setCountdown(getCountdown(doItem.end_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasEndDate, doItem.end_at]);

  return (
    <a
      onClick={handleClick}
      href={`?project_id=${doItem.project_id}&do_id=${doItem.id}`}
      className={twMerge(
        "flex min-w-0 items-start gap-2 bg-card p-2 text-text hover:bg-card-hover md:p-1",
        hasEndDate && countdown.due && "bg-danger-background",
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
              className="size-2.5 shrink-0 rounded-xs border border-border shadow-sm"
            />

            <p className="text-[0.6875rem] leading-tight whitespace-nowrap text-text-muted">
              {doItem.project_name}
            </p>
          </div>

          {doItem.tags?.length > 0 && (
            <div className="flex min-w-0 flex-wrap gap-1">
              {doItem.tags.map((tag) => (
                <Tag
                  key={tag.id}
                  theme={theme}
                  name={tag.name}
                  colour={tag.colour}
                  className="text-[0.625rem] leading-none"
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
