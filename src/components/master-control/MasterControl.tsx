import { twMerge } from "tailwind-merge";

import useMasterControl from "./useMasterControl";
import MasterControlHelper from "./MasterControlHelper";

const MasterControl = () => {
  const {
    command,
    argumentValues,
    executing,
    error,
    selectedSubCommand,
    suggestions,
    selectedSuggestionIndex,
    argumentInputRef,

    handleSelect,
    handleCommandChange,
    handleSuggestionKeyDown,
    handleArgumentChange,
    handleArgumentKeyDown,
  } = useMasterControl();

  return (
    <div className="pointer-events-auto relative flex h-16 w-160 flex-col border border-border bg-card shadow-sm">
      {/* Error */}
      {error && (
        <div
          role="alert"
          className="absolute right-0 bottom-full z-50 mb-2 flex w-max items-start gap-2 border border-danger-border bg-danger-background px-3 py-2 text-xs text-danger shadow-lg"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 1 1.06 0L10 7.94l.72-.72a.75.75 0 1 1 1.06 1.06l-.72.72a.75.75 0 1 1 1.06 1.06l-.72-.72-.72.72a.75.75 0 1 1-1.06-1.06l.72-.72-.72-.72a.75.75 0 0 1 0-1.06Z"
            />
          </svg>

          <span className="min-w-0 flex-1 leading-5">{error}</span>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 z-40 flex w-80 flex-col gap-1 overflow-hidden border border-border bg-card p-1 shadow-lg">
          {suggestions.map((item, index) => {
            const selected = index === selectedSuggestionIndex;

            return (
              <button
                type="button"
                key={item.value}
                disabled={executing}
                onClick={() => handleSelect(item.value)}
                className={`flex w-full flex-col px-2 py-1.5 text-left transition-colors disabled:opacity-50 ${
                  selected ? "bg-card-hover" : "hover:bg-card-hover"
                }`}
              >
                <span className="font-mono text-sm">{item.label}</span>

                <span className="text-xs text-text-muted">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Composer */}
      <div
        className={`flex h-10 shrink-0 items-center bg-input ${
          error ? "border-danger-border" : ""
        }`}
      >
        {/* Command */}
        <input
          value={command}
          disabled={executing}
          aria-invalid={!!error}
          placeholder="/commands, search"
          onKeyDown={handleSuggestionKeyDown}
          onChange={(event) => handleCommandChange(event.target.value)}
          className={twMerge(
            "h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none",
            error && "text-danger",
          )}
        />

        {/* Arguments */}
        {selectedSubCommand?.parts?.map((part, index) => {
          if (part.type === "literal") {
            return (
              <span
                key={`${part.value}-${index}`}
                className="text-muted-foreground px-2"
              >
                {part.value}
              </span>
            );
          }

          const value = argumentValues[part.argument.name] ?? "";

          return (
            <input
              value={value}
              disabled={executing}
              aria-invalid={!!error}
              key={part.argument.name}
              onKeyDown={handleArgumentKeyDown}
              placeholder={part.argument.placeholder}
              ref={index === 0 ? argumentInputRef : undefined}
              onChange={(event) =>
                handleArgumentChange(part.argument.name, event.target.value)
              }
              className={twMerge(
                "placeholder:text-muted-foreground/50 h-full w-32 bg-transparent px-2 text-sm outline-none",
                error && "text-danger",
              )}
            />
          );
        })}
      </div>

      {/* Controls */}
      <MasterControlHelper />
    </div>
  );
};

export default MasterControl;
