import { twMerge } from "tailwind-merge";

import type { MasterControlSuggestion } from "./commands/types";

type MasterControlSuggestionsProps = {
  suggestions: MasterControlSuggestion[];
  selectedIndex: number;
  executing: boolean;
  onSelect: (suggestion: MasterControlSuggestion) => void;
};

const MasterControlSuggestions = ({
  suggestions,
  selectedIndex,
  executing,
  onSelect,
}: MasterControlSuggestionsProps) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 z-40 flex w-80 flex-col gap-1 overflow-hidden border border-border bg-card p-1">
      {suggestions.map((suggestion, index) => {
        const selected = index === selectedIndex;

        return (
          <button
            key={index}
            type="button"
            disabled={executing}
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
    </div>
  );
};

const CommandSuggestionContent = ({
  suggestion,
}: {
  suggestion:
    | Extract<MasterControlSuggestion, { type: "command" }>
    | Extract<MasterControlSuggestion, { type: "sub-command" }>;
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
    <>
      <span
        style={{ color: suggestion.project.colour }}
        className="min-w-0 truncate font-mono text-sm"
      >
        {suggestion.project.name}
      </span>
    </>
  );
};

export default MasterControlSuggestions;
