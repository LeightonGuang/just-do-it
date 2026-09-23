import { useRef } from "react";

import MasterControlInput from "./MasterControlInput";
import MasterControlHelper from "./MasterControlHelper";
import MasterControlError from "./commands/MasterControlError";
import useMasterControl from "./commands/hooks/useMasterControl";
import MasterControlSuggestions from "./MasterControlSuggestions";

const MasterControl = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    inputValue,
    executing,
    error,
    suggestions,
    currentArgument,
    selectedSuggestionIndex,
    handleSelect,
    handleInputChange,
    handleCaretChange,
    handleInputBlur,
    handleInputKeyDown,
  } = useMasterControl(inputRef, containerRef);

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto relative flex h-16 w-160 flex-col border border-border bg-card shadow-sm"
    >
      {error && <MasterControlError error={error} />}

      <MasterControlSuggestions
        executing={executing}
        onSelect={handleSelect}
        suggestions={suggestions}
        currentArgument={currentArgument}
        selectedIndex={selectedSuggestionIndex}
      />

      <div className="flex h-10 shrink-0 items-center overflow-hidden bg-input px-2">
        <MasterControlInput
          ref={inputRef}
          error={!!error}
          value={inputValue}
          disabled={executing}
          onBlur={handleInputBlur}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="/commands, search"
          onCaretChange={handleCaretChange}
        />
      </div>

      <MasterControlHelper />
    </div>
  );
};

export default MasterControl;
