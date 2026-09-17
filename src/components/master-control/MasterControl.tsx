import { twMerge } from "tailwind-merge";
import { useCallback, useRef } from "react";

import AutoSizeInput from "./AutoSizeInput";
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

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const setInputRef = useCallback(
    (index: number, element: HTMLInputElement | null) => {
      inputRefs.current[index] = element;
    },
    [],
  );

  const focusInput = useCallback((index: number, position: "start" | "end") => {
    const input = inputRefs.current[index];

    if (!input || input.disabled) {
      return;
    }

    input.focus();

    requestAnimationFrame(() => {
      if (!input.isConnected) {
        return;
      }

      const cursorPosition = position === "start" ? 0 : input.value.length;

      input.setSelectionRange(cursorPosition, cursorPosition);
    });
  }, []);

  const argumentParts =
    selectedSubCommand?.parts?.filter((part) => part.type === "argument") ?? [];

  const inputCount = 1 + argumentParts.length;

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    inputIndex: number,
  ) => {
    const input = event.currentTarget;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    const valueLength = input.value.length;

    if (
      inputIndex === 0 &&
      event.key === "Tab" &&
      !event.shiftKey &&
      suggestions.length > 0
    ) {
      event.preventDefault();

      const selectedSuggestion = suggestions[selectedSuggestionIndex];

      if (selectedSuggestion) {
        handleSelect(selectedSuggestion.value);
      }

      return;
    }

    if (
      inputIndex === 0 &&
      event.key === " " &&
      selectedSubCommand &&
      inputCount > 1
    ) {
      event.preventDefault();

      focusInput(1, "start");

      return;
    }

    if (
      event.key === "ArrowLeft" &&
      !event.shiftKey &&
      selectionStart === 0 &&
      selectionEnd === 0 &&
      inputIndex > 0
    ) {
      event.preventDefault();

      focusInput(inputIndex - 1, "end");

      return;
    }

    if (
      event.key === "ArrowRight" &&
      !event.shiftKey &&
      selectionStart === valueLength &&
      selectionEnd === valueLength &&
      inputIndex < inputCount - 1
    ) {
      event.preventDefault();

      focusInput(inputIndex + 1, "start");

      return;
    }

    if (
      event.key === "Backspace" &&
      !event.shiftKey &&
      selectionStart === 0 &&
      selectionEnd === 0 &&
      inputIndex > 0
    ) {
      event.preventDefault();

      focusInput(inputIndex - 1, "end");

      return;
    }

    if (inputIndex === 0) {
      handleSuggestionKeyDown(event);
    } else {
      handleArgumentKeyDown(event);
    }
  };

  const handleCommandRef = useCallback(
    (element: HTMLInputElement | null) => {
      setInputRef(0, element);
    },
    [setInputRef],
  );

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
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 1 1.06 0L10 7.94l.72-.72a.75.75 0 1 1 1.06 1.06l-.72.72a.75.75 0 1 1-1.06 1.06l.72.72a.75.75 0 1 1 1.06 1.06l-.72-.72-.72.72a.75.75 0 1 1-1.06-1.06l-.72-.72a.75.75 0 1 1 0-1.06Z"
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
                className={twMerge(
                  "flex w-full flex-col px-2 py-1.5 text-left transition-colors disabled:opacity-50",
                  selected ? "bg-card-hover" : "hover:bg-card-hover",
                )}
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
      <div className="flex h-10 shrink-0 items-center gap-1.5 overflow-hidden bg-input px-2">
        {/* Command */}
        <AutoSizeInput
          type="text"
          value={command}
          error={!!error}
          disabled={executing}
          inputRef={handleCommandRef}
          onChange={handleCommandChange}
          placeholder="/commands, search"
          fullWidth={!selectedSubCommand}
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
              onKeyDown={(event) => handleInputKeyDown(event, inputIndex)}
              onChange={(nextValue) =>
                handleArgumentChange(part.argument.name, nextValue)
              }
              inputRef={(element) => {
                setInputRef(inputIndex, element);

                if (inputIndex === 1) {
                  argumentInputRef.current = element;
                }
              }}
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
