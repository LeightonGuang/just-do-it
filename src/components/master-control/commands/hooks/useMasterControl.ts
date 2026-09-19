import { useCallback, useEffect, useMemo, useState } from "react";

import { COMMANDS } from "../registry";
import { useProjects } from "../../../contexts/ProjectContext";

import useInputNavigation from "./useInputNavigation";
import useProjectSuggestions from "./useProjectSuggestions";
import useCommandSuggestions from "./useCommnandSuggestions";

import type { MasterControlSuggestion } from "../types";
import type { MasterControlSelectedEntity } from "../types";

const isValidHexColor = (value: string) => {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

const useMasterControl = (
  inputRef: React.RefObject<HTMLInputElement | null>,
) => {
  const { fetchSidebarDos, fetchSidebarProjects } = useProjects();

  const [inputValue, setInputValue] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<
    Record<string, MasterControlSelectedEntity>
  >({});
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
      const argument = argumentParts[0].argument;

      values[argument.name] = argumentTokens.join(" ");

      return values;
    }

    const lastArgument = argumentParts[argumentParts.length - 1];
    const firstArguments = argumentParts.slice(0, -1);

    // If the last argument is optional and no value was provided,
    // all tokens belong to the previous argument(s).
    const hasLastArgument =
      argumentTokens.length > 0 &&
      (lastArgument.argument.required ||
        argumentTokens.length > firstArguments.length);

    if (hasLastArgument) {
      const lastValue = argumentTokens.at(-1) ?? "";
      const firstValue = argumentTokens.slice(0, -1).join(" ");

      firstArguments.forEach((part) => {
        values[part.argument.name] = firstValue;
      });

      values[lastArgument.argument.name] = lastValue;
    } else {
      const value = argumentTokens.join(" ");

      firstArguments.forEach((part) => {
        values[part.argument.name] = value;
      });
    }

    return values;
  }, [tokens, selectedSubCommand, argumentParts]);

  const isDeleteProject =
    rootCommand?.command === "/delete" &&
    selectedSubCommand?.name === "project";

  const projectSuggestions = useProjectSuggestions({
    enabled: isDeleteProject,
    query: argumentValues.name ?? "",
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
        const prefix = `${root} ${subCommand}`.trim();

        setSelectedEntities((current) => ({
          ...current,
          project: {
            type: "project",
            id: suggestion.project.id,
            label: suggestion.project.name,
          },
        }));

        setInputValue(`${prefix} ${suggestion.project.name} `);
        setSuggestionsDismissed(true);

        return;
      }

      setInputValue(`${suggestion.value} `);
      setSelectedEntities({});
      setSuggestionsDismissed(false);
    },
    [root, subCommand],
  );

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setSelectedEntities({});
    setError(null);
    setSuggestionsDismissed(false);
  }, []);

  const validateArguments = useCallback(() => {
    if (!selectedSubCommand?.parts) {
      return null;
    }

    for (const part of selectedSubCommand.parts) {
      if (part.type !== "argument") continue;

      const { name, inputType, placeholder, required } = part.argument;

      const value = argumentValues[name]?.trim() ?? "";

      // Only validate empty values when the argument is required
      if (required && !value) return `${placeholder || name} is required`;

      // Only validate the color if a value was actually provided
      if (value && inputType === "color" && !isValidHexColor(value)) {
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
        entities: selectedEntities,
        refetch: {
          projects: fetchSidebarProjects,
          dos: fetchSidebarDos,
        },
      });

      setInputValue("");
      setSelectedEntities({});
      setSuggestionsDismissed(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setExecuting(false);
    }
  }, [
    selectedSubCommand,
    argumentValues,
    selectedEntities,
    validateArguments,
    fetchSidebarProjects,
    fetchSidebarDos,
  ]);

  const reset = useCallback(() => {
    setInputValue("");
    setSelectedEntities({});
    setError(null);
    setSuggestionsDismissed(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || executing) {
        return;
      }

      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();

      inputRef.current?.focus();
      setInputValue("/");
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [executing, inputRef]);

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
    selectedEntities,

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
