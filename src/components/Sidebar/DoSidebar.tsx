import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import { useSidebar, type SidebarDo } from "../contexts/SidebarContext";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  due: boolean;
};

const DoSidebar = ({ className }: { className?: string }) => {
  const { sidebarDos } = useSidebar();

  return (
    <div
      className={twMerge(
        "flex min-w-0 flex-col gap-1 border-t border-border p-4 md:p-2",
        className,
      )}
    >
      <h2 className="text-sm">Dos</h2>

      <div className="flex min-w-0 flex-col gap-y-1">
        {sidebarDos.map((doItem) => (
          <DoSidebarItem key={doItem.id} doItem={doItem} />
        ))}
      </div>
    </div>
  );
};

export default DoSidebar;

const DoSidebarItem = ({ doItem }: { doItem: SidebarDo }) => {
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
      <div className="flex min-w-0 flex-1 items-start gap-1 pr-1">
        <div
          style={{ backgroundColor: doItem.project_colour }}
          className="mt-1 size-2 shrink-0 rounded-full border border-border"
        />

        <span className="min-w-0 flex-1 text-xs wrap-break-word">
          {doItem.title}
        </span>
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

const getCountdown = (endAt: Date | string | null): Countdown => {
  if (!endAt) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      due: false,
    };
  }

  const endDate = endAt instanceof Date ? endAt : new Date(endAt);

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
