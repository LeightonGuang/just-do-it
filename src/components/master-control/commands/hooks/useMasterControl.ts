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

  const [inputValue, setInputValue] = useState("");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  const tokens = useMemo(() => {
    return inputValue.trim().split(/\s+/).filter(Boolean);
  }, [inputValue]);

  const root = tokens[0] ?? "";
  const subCommand = tokens[1] ?? "";

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

  const argumentValues = useMemo(() => {
    if (!selectedSubCommand) return {};

    const values: Record<string, string> = {};
    const argumentTokens = tokens.slice(2);

    if (argumentParts.length === 0) return values;

    if (argumentParts.length === 1) {
      values[argumentParts[0].argument.name] = argumentTokens.join(" ");
      return values;
    }

    const lastArgument = argumentParts[argumentParts.length - 1];

    values[lastArgument.argument.name] =
      argumentTokens[argumentTokens.length - 1] ?? "";

    const firstArgument = argumentParts[0];

    values[firstArgument.argument.name] = argumentTokens.slice(0, -1).join(" ");

    return values;
  }, [tokens, selectedSubCommand, argumentParts]);

  const isDeleteProject =
    rootCommand?.command === "/delete" &&
    selectedSubCommand?.name === "project";

  const projectSuggestions = useProjectSuggestions({
    enabled: isDeleteProject,
    query: argumentValues.project ?? "",
  });

  const commandSuggestions = useCommandSuggestions({
    command: inputValue,
    rootCommand,
    selectedSubCommand,
    projectSuggestions,
  });

  const suggestions = suggestionsDismissed
    ? []
    : commandSuggestions.suggestions;

  const handleSelect = useCallback(
    (suggestion: MasterControlSuggestion) => {
      setError(null);

      if (suggestion.type === "project") {
        setInputValue(`${inputValue.trimEnd()} ${suggestion.project.name} `);

        setSuggestionsDismissed(true);
        return;
      }

      setInputValue(`${suggestion.value} `);
      setSuggestionsDismissed(false);
    },
    [inputValue],
  );

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setError(null);
    setSuggestionsDismissed(false);
  }, []);

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

      setInputValue("");
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

  const reset = useCallback(() => {
    setInputValue("");
    setError(null);
    setSuggestionsDismissed(false);
  }, []);

  const navigation = useInputNavigation({
    suggestions,
    selectedSuggestionIndex: commandSuggestions.selectedIndex,

    hasRawSuggestions: commandSuggestions.rawSuggestions.length > 0,

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

  return {
    inputValue,

    command: root,
    argumentValues,

    executing,
    error,

    selectedSubCommand,
    argumentParts,

    suggestions,
    selectedSuggestionIndex: commandSuggestions.selectedIndex,

    handleSelect,
    handleInputChange,
    handleInputKeyDown: navigation.handleKeyDown,
  };
};

export default useMasterControl;
