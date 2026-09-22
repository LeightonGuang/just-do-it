import { twMerge } from "tailwind-merge";
import { useEffect, useRef } from "react";

import type { ArgumentPart, MasterControlSuggestion } from "./commands/types";

type MasterControlSuggestionsProps = {
  suggestions: MasterControlSuggestion[];
  currentArgument?: ArgumentPart;
  currentArgumentValue?: string;
  selectedIndex: number;
  executing: boolean;
  onSelect: (suggestion: MasterControlSuggestion) => void;
};

const MasterControlSuggestions = ({
  suggestions,
  currentArgument,
  currentArgumentValue,
  selectedIndex,
  executing,
  onSelect,
}: MasterControlSuggestionsProps) => {
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const selectedElement = suggestionRefs.current[selectedIndex];

    selectedElement?.scrollIntoView({
      block: "nearest",
    });
  }, [selectedIndex]);

  if (suggestions.length === 0 && !currentArgument) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 z-40 flex max-h-60 w-max min-w-48 flex-col gap-1 overflow-y-auto border border-border bg-card p-1 shadow-lg">
      {suggestions.map((suggestion, index) => {
        const selected = index === selectedIndex;

        return (
          <button
            type="button"
            disabled={executing}
            key={`${suggestion.type}-${index}`}
            onClick={() => onSelect(suggestion)}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            ref={(element) => {
              suggestionRefs.current[index] = element;
            }}
            className={twMerge(
              "flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors disabled:opacity-50",
              selected ? "bg-card-hover" : "hover:bg-card-hover",
            )}
          >
            {suggestion.type === "project" ? (
              <ProjectSuggestionContent suggestion={suggestion} />
            ) : suggestion.type === "do" ? (
              <DoSuggestionContent suggestion={suggestion} />
            ) : suggestion.type === "column" ? (
              <ColumnSuggestionContent suggestion={suggestion} />
            ) : (
              <CommandSuggestionContent suggestion={suggestion} />
            )}
          </button>
        );
      })}

      {currentArgument && (
        <ArgumentHint argument={currentArgument} value={currentArgumentValue} />
      )}
    </div>
  );
};

const CommandSuggestionContent = ({
  suggestion,
}: {
  suggestion:
    | Extract<MasterControlSuggestion, { type: "command" }>
    | Extract<MasterControlSuggestion, { type: "sub-command" }>
    | Extract<MasterControlSuggestion, { type: "keyword" }>;
}) => {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="font-mono text-sm">{suggestion.label}</span>

      {suggestion.description && (
        <span className="text-xs text-text-muted">
          {suggestion.description}
        </span>
      )}
    </div>
  );
};

const ProjectSuggestionContent = ({
  suggestion,
}: {
  suggestion: Extract<MasterControlSuggestion, { type: "project" }>;
}) => {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: suggestion.project.colour }}
      />
      <span className="min-w-0 truncate font-mono text-sm">
        {suggestion.project.name}
      </span>
    </div>
  );
};

const DoSuggestionContent = ({
  suggestion,
}: {
  suggestion: Extract<MasterControlSuggestion, { type: "do" }>;
}) => {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-mono text-sm">
        {suggestion.doItem.title}
      </span>
    </div>
  );
};

const ColumnSuggestionContent = ({
  suggestion,
}: {
  suggestion: Extract<MasterControlSuggestion, { type: "column" }>;
}) => {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-mono text-sm">
        {suggestion.column.name}
      </span>
    </div>
  );
};

const ArgumentHint = ({
  argument,
  value,
}: {
  argument: ArgumentPart;
  value?: string;
}) => {
  const isColour =
    argument.valueType === "color" &&
    /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(value ?? "");

  return (
    <div className="mt-0.5 flex items-center justify-between gap-6 border-t border-border px-2 py-1.5">
      <div className="flex items-center gap-2">
        {isColour && (
          <span
            style={{ backgroundColor: value }}
            className="h-3 w-3 shrink-0 rounded-sm border border-border"
          />
        )}

        <span className="font-mono text-sm text-text-muted">
          {value || argument.placeholder || argument.name}
        </span>
      </div>

      {!argument.required && (
        <span className="text-xs text-text-muted">optional</span>
      )}
    </div>
  );
};

export default MasterControlSuggestions;
