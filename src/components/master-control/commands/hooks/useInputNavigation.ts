import { useCallback } from "react";

import type { MasterControlSuggestion } from "../types";

type UseInputNavigationOptions = {
  suggestions: MasterControlSuggestion[];
  selectedSuggestionIndex: number;

  hasRawSuggestions: boolean;

  onMoveSuggestionUp: () => void;
  onMoveSuggestionDown: () => void;
  onSelectSuggestion: (suggestion: MasterControlSuggestion) => void;

  onDismissSuggestions: () => void;
  onReopenSuggestions: () => void;

  onReset: () => void;
  onExecute: () => void;
};

const useInputNavigation = ({
  suggestions,
  selectedSuggestionIndex,

  hasRawSuggestions,

  onMoveSuggestionUp,
  onMoveSuggestionDown,
  onSelectSuggestion,

  onDismissSuggestions,
  onReopenSuggestions,

  onReset,
  onExecute,
}: UseInputNavigationOptions) => {
  const selectSuggestion = useCallback(
    (suggestion: MasterControlSuggestion) => {
      onSelectSuggestion(suggestion);
    },
    [onSelectSuggestion],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length > 0) {
        switch (event.key) {
          case "ArrowDown": {
            event.preventDefault();
            onMoveSuggestionDown();
            return;
          }

          case "ArrowUp": {
            event.preventDefault();
            onMoveSuggestionUp();
            return;
          }

          case "Tab":
          case "Enter": {
            const suggestion = suggestions[selectedSuggestionIndex];

            if (suggestion) {
              event.preventDefault();
              selectSuggestion(suggestion);
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              void onExecute();
            }

            return;
          }

          case "Escape": {
            event.preventDefault();
            onDismissSuggestions();
            return;
          }
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onReset();
        return;
      }

      if (event.key === "ArrowDown" && hasRawSuggestions) {
        event.preventDefault();
        onReopenSuggestions();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        void onExecute();
      }
    },
    [
      suggestions,
      selectedSuggestionIndex,
      hasRawSuggestions,
      onMoveSuggestionUp,
      onMoveSuggestionDown,
      onDismissSuggestions,
      onReopenSuggestions,
      onReset,
      onExecute,
      selectSuggestion,
    ],
  );

  return {
    handleKeyDown,
  };
};

export default useInputNavigation;
