import { User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, LogOut, Moon, Settings, Sun } from "lucide-react";

type Theme = "light" | "dark";

const SidebarUserMenu = () => {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const next: Theme = saved === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const changeTheme = (next: Theme) => {
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.dataset.theme = next;
  };

  return (
    <div ref={menuRef} className="relative mt-auto border-t border-border p-3">
      {open && (
        <div className="absolute right-3 bottom-full left-3 z-50 mb-2 border border-border bg-card p-1 shadow-lg">
          <a
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-background"
          >
            <Settings className="size-3.5" />
            Settings
          </a>
          <a
            href="/docs/api"
            className="flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-background"
          >
            <BookOpen className="size-3.5" />
            Documentation
          </a>
          <div className="my-1 border-t border-border" />
          <p className="px-3 pt-1 text-[10px] tracking-wide text-text-muted uppercase">
            Theme
          </p>
          {(["light", "dark"] as Theme[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeTheme(option)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-text capitalize hover:bg-background"
            >
              <span className="flex items-center gap-2">
                {option === "light" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                {option}
              </span>
              {theme === option && <Check className="size-3.5 text-success" />}
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger-background"
          >
            <LogOut className="size-3.5" />
            Log out
          </button>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-left hover:bg-card-hover"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-orange-500 text-white">
          <User className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-text">
            Leighton Guang
          </span>
          <span className="block truncate text-[10px] text-text-muted">
            leighton@example.com
          </span>
        </span>
        {open ? <X className="size-3.5 text-text-muted" /> : <></>}
      </button>
    </div>
  );
};

export default SidebarUserMenu;
