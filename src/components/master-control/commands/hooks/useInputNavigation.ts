import { useCallback, useRef } from "react";

import type { MasterControlSuggestion } from "../types";

type UseInputNavigationOptions = {
  inputCount: number;

  suggestions: MasterControlSuggestion[];
  selectedSuggestionIndex: number;

  hasRawSuggestions: boolean;
  hasSelectedSubCommand: boolean;

  onMoveSuggestionUp: () => void;
  onMoveSuggestionDown: () => void;
  onSelectSuggestion: (suggestion: MasterControlSuggestion) => void;

  onDismissSuggestions: () => void;
  onReopenSuggestions: () => void;

  onReset: () => void;
  onExecute: () => void;
};

const useInputNavigation = ({
  inputCount,
  suggestions,
  selectedSuggestionIndex,

  hasRawSuggestions,
  hasSelectedSubCommand,

  onMoveSuggestionUp,
  onMoveSuggestionDown,
  onSelectSuggestion,

  onDismissSuggestions,
  onReopenSuggestions,

  onReset,
  onExecute,
}: UseInputNavigationOptions) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const setInputRef = useCallback(
    (index: number, element: HTMLInputElement | null) => {
      inputRefs.current[index] = element;
    },
    [],
  );

  const focusInput = useCallback(
    (index: number, position: "start" | "end") => {
      const input = inputRefs.current[index];

      if (!input || input.disabled) {
        return;
      }

      input.focus();

      requestAnimationFrame(() => {
        if (!input.isConnected) {
          return;
        }

        const cursorPosition =
          position === "start" ? 0 : input.value.length;

        input.setSelectionRange(cursorPosition, cursorPosition);
      });
    },
    [],
  );

  const selectSuggestion = useCallback(
    (suggestion: MasterControlSuggestion) => {
      onSelectSuggestion(suggestion);

      /*
       * Command/subcommand/project selections should move
       * into the first argument when one exists.
       *
       * requestAnimationFrame is important here because
       * selecting a command may cause the argument input
       * to be rendered after state updates.
       */
      requestAnimationFrame(() => {
        focusInput(1, "end");
      });
    },
    [onSelectSuggestion, focusInput],
  );

  const handleKeyDown = useCallback(
    (
      event: React.KeyboardEvent<HTMLInputElement>,
      inputIndex: number,
    ) => {
      const input = event.currentTarget;

      const selectionStart = input.selectionStart ?? 0;
      const selectionEnd = input.selectionEnd ?? 0;
      const valueLength = input.value.length;

      /*
       * ---------------------------------------------------------
       * Suggestions
       * ---------------------------------------------------------
       */
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

          case "Tab": {
            if (event.shiftKey) {
              break;
            }

            event.preventDefault();

            const suggestion =
              suggestions[selectedSuggestionIndex];

            if (suggestion) {
              selectSuggestion(suggestion);
            }

            return;
          }

          case "Enter": {
            event.preventDefault();

            const suggestion =
              suggestions[selectedSuggestionIndex];

            if (suggestion) {
              selectSuggestion(suggestion);
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

      /*
       * ---------------------------------------------------------
       * Suggestions hidden
       * ---------------------------------------------------------
       */

      /*
       * Escape resets the entire control.
       */
      if (event.key === "Escape") {
        event.preventDefault();
        onReset();
        return;
      }

      /*
       * ArrowDown reopens available suggestions.
       */
      if (
        event.key === "ArrowDown" &&
        hasRawSuggestions
      ) {
        event.preventDefault();
        onReopenSuggestions();
        return;
      }

      /*
       * ---------------------------------------------------------
       * Input navigation
       * ---------------------------------------------------------
       */

      /*
       * Space from command input moves to the first argument.
       */
      if (
        event.key === " " &&
        inputIndex === 0 &&
        hasSelectedSubCommand &&
        inputCount > 1
      ) {
        event.preventDefault();
        focusInput(1, "start");
        return;
      }

      /*
       * ArrowLeft at the beginning moves to the previous input.
       */
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

      /*
       * ArrowRight at the end moves to the next input.
       */
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

      /*
       * Backspace at the beginning of an argument
       * moves to the previous input.
       */
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

      /*
       * Enter executes the command when there are
       * no visible suggestions.
       */
      if (event.key === "Enter") {
        event.preventDefault();
        void onExecute();
      }
    },
    [
      inputCount,
      suggestions,
      selectedSuggestionIndex,
      hasRawSuggestions,
      hasSelectedSubCommand,

      onMoveSuggestionUp,
      onMoveSuggestionDown,
      onDismissSuggestions,
      onReopenSuggestions,

      onReset,
      onExecute,

      selectSuggestion,
      focusInput,
    ],
  );

  return {
    setInputRef,
    focusInput,
    handleKeyDown,
  };
};

export default useInputNavigation;
