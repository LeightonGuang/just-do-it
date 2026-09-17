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
    argumentInputRef,
    handleSelect,
    handleCommandChange,
    handleArgumentChange,
    handleExecute,
  } = useMasterControl();

  return (
    <div className="pointer-events-auto relative flex h-16 w-160 flex-col border border-border bg-card shadow-sm">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 flex w-80 flex-col gap-2 overflow-hidden border border-border bg-card p-1 shadow-lg">
          {suggestions.map((item) => (
            <button
              type="button"
              key={item.value}
              disabled={executing}
              onClick={() => handleSelect(item.value)}
              className="flex w-full flex-col text-left hover:bg-card-hover disabled:opacity-50"
            >
              <span className="font-mono text-sm">{item.label}</span>

              <span className="text-xs text-text-muted">
                {item.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="flex h-10 shrink-0 items-center bg-input">
        <input
          value={command}
          disabled={executing}
          placeholder="/commands, search"
          onChange={(event) => handleCommandChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleExecute();
            }
          }}
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

          return (
            <input
              disabled={executing}
              key={part.argument.name}
              placeholder={part.argument.placeholder}
              ref={index === 0 ? argumentInputRef : undefined}
              value={argumentValues[part.argument.name] ?? ""}
              onChange={(event) =>
                handleArgumentChange(part.argument.name, event.target.value)
              }
              className="placeholder:text-muted-foreground/50 h-full w-32 bg-transparent px-2 text-sm outline-none"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleExecute();
                }
              }}
            />
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="border-t border-danger-border bg-danger-background px-3 py-1 text-xs text-danger">
          {error}
        </div>
      )}

      <MasterControlHelper />
    </div>
  );
};

export default MasterControl;
