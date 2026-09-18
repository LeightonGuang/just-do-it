import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { COMMANDS } from "./commands/registry";
import { useProjects } from "../contexts/ProjectContext";

const isValidHexColor = (value: string) => {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

const useMasterControl = () => {
  const { fetchDos, fetchProjects } = useProjects();

  const [command, setCommand] = useState("");
  const [argumentValues, setArgumentValues] = useState<Record<string, string>>(
    {},
  );
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const argumentInputRef = useRef<HTMLInputElement>(null);

  const rootCommand = useMemo(() => {
    const [root] = command.split(" ");

    return COMMANDS.find((item) => item.command === root);
  }, [command]);

  const selectedSubCommand = useMemo(() => {
    if (!rootCommand) return undefined;

    const [, subCommand] = command.split(" ");

    if (!subCommand) return undefined;

    return rootCommand.subCommands?.find((item) => item.name === subCommand);
  }, [command, rootCommand]);

  const suggestions = useMemo(() => {
    if (!command.startsWith("/")) return [];

    if (selectedSubCommand) return [];

    if (command === "/") {
      return COMMANDS.map((item) => ({
        type: "command" as const,
        value: item.command,
        label: item.command,
        description: item.description,
      }));
    }

    if (!command.includes(" ")) {
      return COMMANDS.filter((item) => item.command.startsWith(command)).map(
        (item) => ({
          type: "command" as const,
          value: item.command,
          label: item.command,
          description: item.description,
        }),
      );
    }

    if (rootCommand?.subCommands) {
      const [, subQuery = ""] = command.split(" ");

      return rootCommand.subCommands
        .filter((item) => item.name.startsWith(subQuery))
        .map((item) => ({
          type: "sub-command" as const,
          value: `${rootCommand.command} ${item.name}`,
          label: item.name,
          description: item.description,
        }));
    }

    return [];
  }, [command, rootCommand, selectedSubCommand]);

  /*
   * Reset the highlighted suggestion whenever
   * the suggestion list changes.
   */
  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [suggestions]);

  /*
   * Select a suggestion.
   */
  const handleSelect = (value: string) => {
    const nextValue = `${value} `;

    setCommand(nextValue);
    setArgumentValues({});
    setError(null);

    requestAnimationFrame(() => {
      argumentInputRef.current?.focus();
    });
  };

  /*
   * Handle command input changes.
   */
  const handleCommandChange = (value: string) => {
    setCommand(value);
    setArgumentValues({});
    setError(null);
  };

  const handleArgumentChange = (name: string, value: string) => {
    setArgumentValues((current) => ({
      ...current,
      [name]: value,
    }));

    setError(null);
  };

  const validateArguments = () => {
    if (!selectedSubCommand?.parts) return null;

    for (const part of selectedSubCommand.parts) {
      if (part.type !== "argument") continue;

      const { name, inputType, placeholder } = part.argument;
      const value = argumentValues[name]?.trim() ?? "";

      /*
       * Required arguments
       */
      if (!value) return `${placeholder || name} is required`;

      /*
       * Color arguments
       */
      if (inputType === "color" && !isValidHexColor(value)) {
        return `${name} must be a valid hex color`;
      }
    }

    return null;
  };

  /*
   * Execute the currently selected command.
   */
  const handleExecute = async () => {
    if (!selectedSubCommand?.execute) return;

    const validationError = validateArguments();

    if (validationError) {
      setError(validationError);
      return;
    }

    setExecuting(true);
    setError(null);

    try {
      await selectedSubCommand.execute({
        args: argumentValues,
        refetch: { projects: fetchProjects, dos: fetchDos },
      });

      /*
       * Reset after successful execution.
       */
      setCommand("");
      setArgumentValues({});
      setSelectedSuggestionIndex(0);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setExecuting(false);
    }
  };

  /*
   * Keyboard navigation for the suggestion list.
   */
  const handleSuggestionKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (suggestions.length === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleExecute();
      }

      return;
    }

    /*
     * Move down.
     *
     * Last item wraps to first.
     */
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setSelectedSuggestionIndex((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1,
      );

      return;
    }

    /*
     * Move up.
     *
     * First item wraps to last.
     */
    if (event.key === "ArrowUp") {
      event.preventDefault();

      setSelectedSuggestionIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );

      return;
    }

    /*
     * Enter selects the highlighted suggestion.
     */
    if (event.key === "Enter") {
      event.preventDefault();

      const selected = suggestions[selectedSuggestionIndex];

      if (selected) handleSelect(selected.value);

      return;
    }

    /*
     * Escape closes the suggestions.
     */
    if (event.key === "Escape") {
      event.preventDefault();

      setCommand("");
      setArgumentValues({});
      setSelectedSuggestionIndex(0);
    }
  };

  /*
   * Keyboard handling for argument inputs.
   *
   * Enter executes the command.
   */
  const handleArgumentKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleExecute();
    }
  };

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const setInputRef = useCallback(
    (index: number, element: HTMLInputElement | null) => {
      inputRefs.current[index] = element;
    },
    [],
  );

  const focusInput = useCallback((index: number, position: "start" | "end") => {
    const input = inputRefs.current[index];

    if (!input || input.disabled) return;

    input.focus();

    requestAnimationFrame(() => {
      if (!input.isConnected) return;

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

  return {
    command,
    argumentValues,
    executing,
    error,
    selectedSubCommand,
    suggestions,
    selectedSuggestionIndex,

    argumentParts,

    argumentInputRef,
    setInputRef,

    handleSelect,
    handleCommandChange,
    handleArgumentChange,
    handleInputKeyDown,
    handleCommandRef,
  };
};

export default useMasterControl;
