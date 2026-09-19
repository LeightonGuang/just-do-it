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
    const argumentText = inputValue.trim().split(/\s+/).slice(2);

    if (argumentParts.length === 0) return values;

    if (argumentParts.length === 1) {
      values[argumentParts[0].argument.name] = argumentText.join(" ");

      return values;
    }

    let tokenIndex = 0;

    for (let index = 0; index < argumentParts.length; index++) {
      const part = argumentParts[index];
      const isLastArgument = index === argumentParts.length - 1;

      if (isLastArgument) {
        values[part.argument.name] = argumentText[tokenIndex] ?? "";
        break;
      }

      const remainingArguments = argumentParts.length - index - 1;
      const remainingTokens = argumentText.length - tokenIndex;
      const tokensForArgument = Math.max(
        0,
        remainingTokens - remainingArguments,
      );

      values[part.argument.name] = argumentText
        .slice(tokenIndex, tokenIndex + tokensForArgument)
        .join(" ");

      tokenIndex += tokensForArgument;
    }

    return values;
  }, [inputValue, selectedSubCommand, argumentParts]);

  const isDeleteProject =
    rootCommand?.command === "/delete" &&
    selectedSubCommand?.name === "project";

  const projectQuery = useMemo(() => {
    if (!isDeleteProject) return "";

    const prefix = `${root} ${subCommand}`;

    if (!inputValue.startsWith(prefix)) return "";

    return inputValue.slice(prefix.length).trimStart();
  }, [inputValue, root, subCommand, isDeleteProject]);

  const projectSuggestions = useProjectSuggestions({
    enabled: isDeleteProject,
    query: projectQuery,
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
