import AutoSizeInput from "./AutoSizeInput";
import MasterControlHelper from "./MasterControlHelper";
import MasterControlError from "./commands/MasterControlError";
import useMasterControl from "./commands/hooks/useMasterControl";
import MasterControlSuggestions from "./MasterControlSuggestions";

const MasterControl = () => {
  const {
    command,
    argumentValues,
    executing,
    error,

    selectedSubCommand,

    suggestions,
    selectedSuggestionIndex,

    argumentParts,

    setInputRef,

    handleSelect,
    handleCommandChange,
    handleArgumentChange,
    handleInputKeyDown,
  } = useMasterControl();

  return (
    <div className="pointer-events-auto relative flex h-16 w-160 flex-col border border-border bg-card shadow-sm">
      {error && <MasterControlError error={error} />}

      <MasterControlSuggestions
        executing={executing}
        onSelect={handleSelect}
        suggestions={suggestions}
        selectedIndex={selectedSuggestionIndex}
      />

      {/* Composer */}
      <div className="flex h-10 shrink-0 items-center gap-1.5 overflow-hidden bg-input px-2">
        {/* Command */}
        <AutoSizeInput
          type="text"
          value={command}
          error={!!error}
          disabled={executing}
          onChange={handleCommandChange}
          placeholder="/commands, search"
          fullWidth={!selectedSubCommand}
          inputRef={(element) => setInputRef(0, element)}
          onKeyDown={(event) => handleInputKeyDown(event, 0)}
        />

        {/* Arguments */}
        {selectedSubCommand?.parts?.map((part) => {
          if (part.type === "literal") {
            return (
              <span
                key={`literal-${part.value}`}
                className="text-muted-foreground shrink-0"
              >
                {part.value}
              </span>
            );
          }

          const argumentIndex = argumentParts.findIndex(
            (argumentPart) => argumentPart.argument.name === part.argument.name,
          );

          const inputIndex = argumentIndex + 1;

          const value = argumentValues[part.argument.name] ?? "";

          return (
            <AutoSizeInput
              value={value}
              error={!!error}
              disabled={executing}
              key={part.argument.name}
              placeholder={part.argument.placeholder}
              type={part.argument.inputType ?? "text"}
              inputRef={(element) => setInputRef(inputIndex, element)}
              onKeyDown={(event) => handleInputKeyDown(event, inputIndex)}
              onChange={(nextValue) =>
                handleArgumentChange(part.argument.name, nextValue)
              }
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
