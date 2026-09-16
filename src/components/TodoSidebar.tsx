import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import { dos, type Dos } from "../../public/data/dos";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  due: boolean;
};

const TodoSidebar = ({ className }: { className?: string }) => {
  return (
    <div
      className={twMerge(
        "flex flex-col gap-1 border-t border-border p-2",
        className,
      )}
    >
      <h2 className="text-sm">Todos</h2>

      <div className="grid grid-cols-[minmax(0,1fr)_3ch_1ch_1ch_2ch_1ch_2ch] gap-y-1">
        {dos.map((todo) => (
          <TodoSidebarItem key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  );
};

export default TodoSidebar;

const TodoSidebarItem = ({ todo }: { todo: Dos }) => {
  const [countdown, setCountdown] = useState<Countdown>(() =>
    getCountdown(todo.due_at),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(todo.due_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [todo.due_at]);

  return (
    <a
      href={`?project_id=${todo.project_id}&dos_id=${todo.id}`}
      className={twMerge(
        "col-span-7 grid grid-cols-subgrid items-center bg-card p-1 hover:bg-card-hover",
        countdown.due && "bg-danger-background",
      )}
    >
      {/* Todo */}
      <div className="flex min-w-0 items-center gap-1 pr-1">
        <div
          style={{ backgroundColor: todo.project_colour }}
          className="size-2 rounded-full border border-border"
        />

        <span className="min-w-0 flex-1 truncate text-xs">{todo.name}</span>
      </div>

      {/* Day */}
      <span className="text-right text-[10px] text-text-muted tabular-nums">
        {!countdown.due && countdown.days > 0 ? `${countdown.days}d,` : ""}
      </span>

      {/* Hour */}
      <span className="text-right text-[10px] text-text-muted tabular-nums">
        {!countdown.due ? countdown.hours : ""}
      </span>

      {/* : */}
      <span className="text-center text-[10px] text-text-muted">
        {!countdown.due ? ":" : ""}
      </span>

      {/* Minutes */}
      <span className="text-right text-[10px] text-text-muted tabular-nums">
        {!countdown.due ? String(countdown.minutes).padStart(2, "0") : ""}
      </span>

      {/* : */}
      <span className="text-center text-[10px] text-text-muted">
        {!countdown.due ? ":" : ""}
      </span>

      {/* Seconds */}
      <span className="text-right text-[10px] text-text-muted tabular-nums">
        {!countdown.due ? (
          String(countdown.seconds).padStart(2, "0")
        ) : (
          <span className="animate-pulse font-medium text-danger">Due</span>
        )}
      </span>
    </a>
  );
};

const getCountdown = (dueAt: string): Countdown => {
  const diff = new Date(dueAt).getTime() - Date.now();

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
