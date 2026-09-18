import { useCallback, useMemo, useState } from "react";

import { COMMANDS } from "../registry";
import { useProjects } from "../../../contexts/ProjectContext";

import useInputNavigation from "./useInputNavigation";
import useProjectSuggestions from "./useProjectSuggestions";
import useCommandSuggestions from "./useCommnandSuggestions";

import type { MasterControlSuggestion } from "../types";

const isValidHexColor = (value: string) => {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

const useMasterControl = () => {
  const { fetchSidebarDos, fetchSidebarProjects } = useProjects();

  const [command, setCommand] = useState("");
  const [argumentValues, setArgumentValues] = useState<Record<string, string>>(
    {},
  );
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  const [root, subCommand] = command.split(" ");

  const rootCommand = useMemo(() => {
    return COMMANDS.find((item) => item.command === root);
  }, [root]);

  const selectedSubCommand = useMemo(() => {
    if (!rootCommand || !subCommand) {
      return undefined;
    }

    return rootCommand.subCommands?.find((item) => item.name === subCommand);
  }, [rootCommand, subCommand]);

  const argumentParts =
    selectedSubCommand?.parts?.filter((part) => part.type === "argument") ?? [];

  const inputCount = 1 + argumentParts.length;

  const isDeleteProject =
    rootCommand?.command === "/delete" &&
    selectedSubCommand?.name === "project";

  const projectSuggestions = useProjectSuggestions({
    enabled: isDeleteProject,
    query: argumentValues.project ?? "",
  });

  /*
   * ---------------------------------------------------------
   * Command suggestions
   * ---------------------------------------------------------
   */

  const commandSuggestions = useCommandSuggestions({
    command,
    rootCommand,
    selectedSubCommand,
    projectSuggestions,
  });

  const suggestions = suggestionsDismissed
    ? []
    : commandSuggestions.suggestions;

  /*
   * ---------------------------------------------------------
   * Select suggestion
   * ---------------------------------------------------------
   */

  const handleSelect = useCallback((suggestion: MasterControlSuggestion) => {
    setError(null);

    /*
     * Dynamic argument suggestion.
     *
     * Example:
     *
     * /delete project
     *               ↓
     *             My Project
     */
    if (suggestion.type === "project") {
      setArgumentValues((current) => ({
        ...current,
        project: suggestion.project.name,
      }));

      setSuggestionsDismissed(true);

      return;
    }

    /*
     * Command or subcommand suggestion.
     *
     * Example:
     *
     * /del
     *   ↓
     * /delete
     *
     * /delete p
     *         ↓
     * /delete project
     */
    setCommand(`${suggestion.value} `);
    setArgumentValues({});
    setSuggestionsDismissed(false);
  }, []);

  /*
   * ---------------------------------------------------------
   * Command input
   * ---------------------------------------------------------
   */

  const handleCommandChange = useCallback((value: string) => {
    setCommand(value);
    setArgumentValues({});
    setError(null);
    setSuggestionsDismissed(false);
  }, []);

  /*
   * ---------------------------------------------------------
   * Argument input
   * ---------------------------------------------------------
   */

  const handleArgumentChange = useCallback((name: string, value: string) => {
    setArgumentValues((current) => ({
      ...current,
      [name]: value,
    }));

    setError(null);
    setSuggestionsDismissed(false);
  }, []);

  /*
   * ---------------------------------------------------------
   * Validation
   * ---------------------------------------------------------
   */

  const validateArguments = useCallback(() => {
    if (!selectedSubCommand?.parts) {
      return null;
    }

    for (const part of selectedSubCommand.parts) {
      if (part.type !== "argument") {
        continue;
      }

      const { name, inputType, placeholder } = part.argument;

      const value = argumentValues[name]?.trim() ?? "";

      if (!value) {
        return `${placeholder || name} is required`;
      }

      if (inputType === "color" && !isValidHexColor(value)) {
        return `${name} must be a valid hex color`;
      }
    }

    return null;
  }, [selectedSubCommand, argumentValues]);

  /*
   * ---------------------------------------------------------
   * Execute
   * ---------------------------------------------------------
   */

  const handleExecute = useCallback(async () => {
    if (!selectedSubCommand?.execute) {
      return;
    }

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
        refetch: {
          projects: fetchSidebarProjects,
          dos: fetchSidebarDos,
        },
      });

      /*
       * Successful execution resets the control.
       */
      setCommand("");
      setArgumentValues({});
      setSuggestionsDismissed(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setExecuting(false);
    }
  }, [
    selectedSubCommand,
    argumentValues,
    validateArguments,
    fetchSidebarProjects,
    fetchSidebarDos,
  ]);

  /*
   * ---------------------------------------------------------
   * Reset
   * ---------------------------------------------------------
   */

  const reset = useCallback(() => {
    setCommand("");
    setArgumentValues({});
    setError(null);
    setSuggestionsDismissed(false);
  }, []);

  /*
   * ---------------------------------------------------------
   * Input navigation
   * ---------------------------------------------------------
   */

  const navigation = useInputNavigation({
    inputCount,

    suggestions,
    selectedSuggestionIndex: commandSuggestions.selectedIndex,

    hasRawSuggestions: commandSuggestions.rawSuggestions.length > 0,

    hasSelectedSubCommand: Boolean(selectedSubCommand),

    onMoveSuggestionUp: commandSuggestions.moveUp,

    onMoveSuggestionDown: commandSuggestions.moveDown,

    onSelectSuggestion: handleSelect,

    onDismissSuggestions: () => {
      setSuggestionsDismissed(true);
    },

    onReopenSuggestions: () => {
      setSuggestionsDismissed(false);
    },

    onReset: reset,
    onExecute: handleExecute,
  });

  /*
   * ---------------------------------------------------------
   * Public API
   * ---------------------------------------------------------
   */

  return {
    command,
    argumentValues,

    executing,
    error,

    selectedSubCommand,
    argumentParts,

    suggestions,
    selectedSuggestionIndex: commandSuggestions.selectedIndex,

    handleSelect,
    handleCommandChange,
    handleArgumentChange,

    setInputRef: navigation.setInputRef,

    handleInputKeyDown: navigation.handleKeyDown,
  };
};

export default useMasterControl;
