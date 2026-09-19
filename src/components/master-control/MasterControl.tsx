import { useEffect, useRef } from "react";

import MasterControlInput from "./MasterControlInput";
import MasterControlHelper from "./MasterControlHelper";
import MasterControlError from "./commands/MasterControlError";
import useMasterControl from "./commands/hooks/useMasterControl";
import MasterControlSuggestions from "./MasterControlSuggestions";

const MasterControl = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    inputValue,
    executing,
    error,

    suggestions,
    selectedSuggestionIndex,

    handleSelect,
    handleInputChange,
    handleInputKeyDown,
  } = useMasterControl(inputRef);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Don't trigger when the user is already typing in an input,
      // textarea, or other editable element.
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key !== "/") {
        return;
      }

      event.preventDefault();

      inputRef.current?.focus();

      // Put "/" into the input.
      handleInputChange("/");
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleInputChange]);

  return (
    <div className="pointer-events-auto relative flex h-16 w-160 flex-col border border-border bg-card shadow-sm">
      {error && <MasterControlError error={error} />}

      <MasterControlSuggestions
        executing={executing}
        onSelect={handleSelect}
        suggestions={suggestions}
        selectedIndex={selectedSuggestionIndex}
      />

      <div className="flex h-10 shrink-0 items-center overflow-hidden bg-input px-2">
        <MasterControlInput
          ref={inputRef}
          error={!!error}
          value={inputValue}
          disabled={executing}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="/commands, search"
        />
      </div>

      <MasterControlHelper />
    </div>
  );
};

export default MasterControl;
