import { useEffect, useMemo, useRef, useState } from "react";

import { COMMANDS } from "./commands/registry";

const useMasterControl = () => {
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
  }, [command, rootCommand]);

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

  /*
   * Execute the currently selected command.
   */
  const handleExecute = async () => {
    if (!selectedSubCommand?.execute) return;

    setExecuting(true);
    setError(null);

    try {
      await selectedSubCommand.execute({ args: argumentValues });

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

  return {
    command,
    argumentValues,
    executing,
    error,

    rootCommand,
    selectedSubCommand,

    suggestions,
    selectedSuggestionIndex,

    argumentInputRef,

    handleSelect,
    handleCommandChange,
    handleArgumentChange,
    handleExecute,
    handleSuggestionKeyDown,
    handleArgumentKeyDown,
  };
};

export default useMasterControl;
