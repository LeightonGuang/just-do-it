import { useMemo, useRef, useState } from "react";

import { COMMANDS } from "./commands/registry";

const useMasterControl = () => {
  const [command, setCommand] = useState("");
  const [argumentValues, setArgumentValues] = useState<Record<string, string>>(
    {},
  );
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState("");

  const argumentInputRef = useRef<HTMLInputElement>(null);

  const rootCommand = useMemo(() => {
    const [root] = command.trim().split(/\s+/);

    return COMMANDS.find((item) => item.command === root);
  }, [command]);

  const selectedSubCommand = useMemo(() => {
    if (!rootCommand) {
      return undefined;
    }

    const [, subCommand] = command.trim().split(/\s+/);

    if (!subCommand) {
      return undefined;
    }

    return rootCommand.subCommands?.find((item) => item.name === subCommand);
  }, [command, rootCommand]);

  /**
   * Generate suggestions based on what the user has typed.
   */
  const suggestions = useMemo(() => {
    if (!command.startsWith("/")) {
      return [];
    }

    // User has only typed "/"
    if (command === "/") {
      return COMMANDS.map((item) => ({
        type: "command" as const,
        value: item.command,
        label: item.command,
        description: item.description,
      }));
    }

    // User is typing the root command.
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

    // User has selected a root command and is typing a sub-command.
    if (rootCommand?.subCommands) {
      const [, subQuery = ""] = command.trim().split(/\s+/);

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

  /**
   * Select a command/sub-command from suggestions.
   */
  const handleSelect = (value: string) => {
    setCommand(value);
    setArgumentValues({});
    setError("");

    requestAnimationFrame(() => {
      argumentInputRef.current?.focus();
    });
  };

  /**
   * Update the command input.
   */
  const handleCommandChange = (value: string) => {
    setCommand(value);
    setArgumentValues({});
    setError("");
  };

  /**
   * Update a command argument.
   */
  const handleArgumentChange = (name: string, value: string) => {
    setArgumentValues((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  /**
   * Execute the currently selected command.
   */
  const handleExecute = async () => {
    if (!selectedSubCommand?.execute || executing) {
      return;
    }

    setExecuting(true);
    setError("");

    try {
      await selectedSubCommand.execute({
        args: argumentValues,
      });

      // Reset Master Control after successful execution.
      setCommand("");
      setArgumentValues({});
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setExecuting(false);
    }
  };

  return {
    // State
    command,
    argumentValues,
    executing,
    error,

    // Derived state
    rootCommand,
    selectedSubCommand,
    suggestions,

    // Refs
    argumentInputRef,

    // Actions
    handleSelect,
    handleCommandChange,
    handleArgumentChange,
    handleExecute,
  };
};

export default useMasterControl;
