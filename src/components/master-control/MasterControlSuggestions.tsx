import { twMerge } from "tailwind-merge";

import type { CommandPart } from "./commands/registry";
import type { MasterControlSuggestion } from "./commands/types";

type MasterControlSuggestionsProps = {
  suggestions: MasterControlSuggestion[];
  currentArgument?: Extract<CommandPart, { type: "argument" }>["argument"];
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
  if (suggestions.length === 0 && !currentArgument) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 z-40 flex w-max min-w-48 flex-col gap-1 overflow-hidden border border-border bg-card p-1">
      {suggestions.map((suggestion, index) => {
        const selected = index === selectedIndex;

        if (suggestion.type === "argument") {
          return null;
        }

        return (
          <button
            type="button"
            disabled={executing}
            key={`${suggestion.type}-${index}`}
            onClick={() => onSelect(suggestion)}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            className={twMerge(
              "flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors disabled:opacity-50",
              selected ? "bg-card-hover" : "hover:bg-card-hover",
            )}
          >
            {suggestion.type === "project" ? (
              <ProjectSuggestionContent suggestion={suggestion} />
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
    <span
      style={{ color: suggestion.project.colour }}
      className="min-w-0 truncate font-mono text-sm"
    >
      {suggestion.project.name}
    </span>
  );
};

const ArgumentHint = ({
  argument,
  value,
}: {
  argument: Extract<CommandPart, { type: "argument" }>["argument"];
  value?: string;
}) => {
  const isColour =
    argument.kind === "color" &&
    /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(value ?? "");

  return (
    <div className="flex items-center justify-between gap-6 px-2 py-1.5">
      <div className="flex items-center gap-2">
        {isColour && (
          <span
            style={{ backgroundColor: value }}
            className="h-3 w-3 shrink-0 rounded-sm border border-border"
          />
        )}

        <span className="font-mono text-sm text-text-muted">
          {value || argument.placeholder}
        </span>
      </div>

      {!argument.required && (
        <span className="text-xs text-text-muted">optional</span>
      )}
    </div>
  );
};

export default MasterControlSuggestions;
