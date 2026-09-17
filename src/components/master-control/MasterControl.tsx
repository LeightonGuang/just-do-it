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
    handleArgumentChange,
    handleSuggestionKeyDown,
    handleArgumentKeyDown,
  } = useMasterControl();

  return (
    <div className="pointer-events-auto relative flex h-16 w-160 flex-col border border-border bg-card shadow-sm">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 flex w-80 flex-col gap-1 overflow-hidden border border-border bg-card p-1 shadow-lg">
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
      <div className="flex h-10 shrink-0 items-center bg-input">
        {/* Command */}
        <input
          value={command}
          disabled={executing}
          placeholder="/commands, search"
          onKeyDown={handleSuggestionKeyDown}
          onChange={(event) => handleCommandChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
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
              onKeyDown={handleArgumentKeyDown}
              placeholder={part.argument.placeholder}
              ref={index === 0 ? argumentInputRef : undefined}
              value={argumentValues[part.argument.name] ?? ""}
              onChange={(event) =>
                handleArgumentChange(part.argument.name, event.target.value)
              }
              className="placeholder:text-muted-foreground/50 h-full w-32 bg-transparent px-2 text-sm outline-none"
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

      {/* Controls */}
      <MasterControlHelper />
    </div>
  );
};

export default MasterControl;
