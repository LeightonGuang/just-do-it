import { useCallback, useEffect, useMemo, useState } from "react";

import { COMMANDS } from "../registry";
import { parseCommand } from "../parser";
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

  const parsedCommand = useMemo(() => {
    return parseCommand(inputValue, selectedSubCommand, selectedEntities);
  }, [inputValue, selectedSubCommand, selectedEntities]);

  const argumentValues = parsedCommand.args;

  const argumentParts =
    selectedSubCommand?.parts?.filter((part) => part.type === "argument") ?? [];

  const activeEntityType =
    parsedCommand.nextPart?.type === "argument" &&
    parsedCommand.nextPart.argument.kind === "entity"
      ? parsedCommand.nextPart.argument.entityType
      : undefined;

  const projectQuery =
    parsedCommand.nextPart?.type === "argument" &&
    parsedCommand.nextPart.argument.kind === "entity" &&
    parsedCommand.nextPart.argument.entityType === "project"
      ? (argumentValues[parsedCommand.nextPart.argument.name] ?? "")
      : "";

  const projectSuggestions = useProjectSuggestions({
    enabled: activeEntityType === "project",
    query: projectQuery,
  });

  const commandSuggestions = useCommandSuggestions({
    command: inputValue,
    rootCommand,
    selectedSubCommand,
    projectSuggestions,
    nextPart: parsedCommand.nextPart,
  });

  const suggestions = suggestionsDismissed
    ? []
    : commandSuggestions.suggestions;

  const handleSelect = useCallback(
    (suggestion: MasterControlSuggestion) => {
      setError(null);

      if (suggestion.type === "project") {
        setSelectedEntities((current) => ({
          ...current,
          project: {
            type: "project",
            id: suggestion.project.id,
            label: suggestion.project.name,
          },
        }));

        setInputValue(`${inputValue.trim()} ${suggestion.project.name} `);

        setSuggestionsDismissed(true);

        return;
      }

      if (suggestion.type === "keyword") {
        setInputValue(`${inputValue.trim()} ${suggestion.value} `);

        setSuggestionsDismissed(false);

        return;
      }

      setInputValue(`${suggestion.value} `);
      setSelectedEntities({});
      setSuggestionsDismissed(false);
    },
    [inputValue],
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

      const { name, kind, placeholder, required } = part.argument;

      const value = argumentValues[name]?.trim() ?? "";

      if (required && !value) {
        return `${placeholder || name} is required`;
      }

      if (value && kind === "color" && !isValidHexColor(value)) {
        return `${name} must be a valid hex color`;
      }

      if (kind === "entity" && required && !selectedEntities[name]) {
        return `${placeholder || name} is required`;
      }
    }

    return null;
  }, [selectedSubCommand, argumentValues, selectedEntities]);

  const handleExecute = useCallback(async () => {
    if (!selectedSubCommand?.execute) {
      return;
    }

    if (!parsedCommand.complete) {
      const nextPart = parsedCommand.nextPart;

      if (nextPart?.type === "keyword") {
        setError(`Expected "${nextPart.keyword.value}"`);
      } else if (nextPart?.type === "argument") {
        setError(`${nextPart.argument.placeholder} is required`);
      }

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
    parsedCommand,
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
