import { useEffect, useRef, useState } from "react";
import { CircleQuestionMark, Search, X } from "lucide-react";

const commands = [
  {
    name: "/help",
    description: "Show all available commands",
    shortcut: "?",
  },
  {
    name: "/search",
    description: "Search for resources and records",
    shortcut: "",
  },
  {
    name: "/create project",
    description: "Create a new project",
    shortcut: "",
  },
  {
    name: "/create do",
    description: "Create a new do item",
    shortcut: "",
  },
  {
    name: "/edit project",
    description: "Edit an existing project",
    shortcut: "",
  },
  {
    name: "/edit do",
    description: "Edit an existing do item",
    shortcut: "",
  },
  {
    name: "/delete project",
    description: "Delete an existing project",
    shortcut: "",
  },
  {
    name: "/delete do",
    description: "Delete an existing do item",
    shortcut: "",
  },
  {
    name: "/move do",
    description: "Move a do item to another column",
    shortcut: "",
  },
];

const MasterControlHelper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(
    (command) =>
      command.name.toLowerCase().includes(search.toLowerCase()) ||
      command.description.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={popupRef}
      className="flex min-h-6 flex-1 items-center border-t border-border px-2 text-sm"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Show available commands"
        onClick={() => setIsOpen((open) => !open)}
        className="hover:text-foreground text-text-muted transition-colors"
      >
        <CircleQuestionMark className="size-4" />
      </button>

      {isOpen && (
        <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-50 w-full border border-border bg-card shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <div>
              <h3 className="text-foreground font-medium">
                Available commands
              </h3>
              <p className="text-xs text-text-muted">
                Browse commands and their usage
              </p>
            </div>

            <button
              type="button"
              aria-label="Close command help"
              onClick={() => setIsOpen(false)}
              className="hover:text-foreground text-text-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 border border-border bg-input px-2">
              <Search className="size-4 shrink-0 text-text-muted" />

              <input
                autoFocus
                value={search}
                placeholder="Filter commands..."
                onChange={(event) => setSearch(event.target.value)}
                className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Commands */}
          <div className="max-h-64 overflow-y-auto p-1.5">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((command) => (
                <button
                  type="button"
                  key={command.name}
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="hover:bg-accent flex w-full items-start justify-between gap-3 px-2 py-2 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <code className="text-foreground text-sm font-medium">
                      {command.name}
                    </code>

                    <p className="mt-0.5 text-xs text-text-muted">
                      {command.description}
                    </p>
                  </div>

                  {command.shortcut && (
                    <kbd className="shrink-0 border border-border px-1.5 py-0.5 text-xs text-text-muted">
                      {command.shortcut}
                    </kbd>
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-xs text-text-muted">
                No matching commands found.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-3 py-2 text-xs text-text-muted">
            Press <kbd className="border border-border px-1">Esc</kbd> to close
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterControlHelper;
