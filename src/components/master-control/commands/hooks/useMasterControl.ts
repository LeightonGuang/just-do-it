import { useCallback, useEffect, useMemo, useState } from "react";

import { COMMANDS } from "../registry";
import { parseCommand } from "../parser";
import useInputNavigation from "./useInputNavigation";
import useEntitySuggestions from "./useEntitySuggestions";
import useCommandSuggestions from "./useCommandSuggestions";
import { useProjects } from "../../../contexts/SidebarContext";

import type { MasterControlSuggestion, SelectedEntity } from "../types";

const isValidHexColor = (value: string) => {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

const useMasterControl = (
  inputRef: React.RefObject<HTMLInputElement | null>,
) => {
  const { fetchSidebarDos, fetchSidebarProjects } = useProjects();

  const [inputValue, setInputValue] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<
    Record<string, SelectedEntity>
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
    return COMMANDS.find((item) => item.name === root);
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
    parsedCommand.nextPart.valueType === "entity"
      ? parsedCommand.nextPart.entityType
      : undefined;

  const entityQuery =
    parsedCommand.nextPart?.type === "argument" &&
    parsedCommand.nextPart.valueType === "entity"
      ? (argumentValues[parsedCommand.nextPart.name] ?? "")
      : "";

  const entitySuggestions = useEntitySuggestions({
    enabled: !!activeEntityType,
    entityType: activeEntityType,
    query: entityQuery,
  });

  const commandSuggestions = useCommandSuggestions({
    command: inputValue,
    rootCommand,
    selectedSubCommand,
    entitySuggestions,
    nextPart: parsedCommand.nextPart,
  });

  const suggestions = suggestionsDismissed
    ? []
    : commandSuggestions.suggestions;

  const currentArgument = suggestionsDismissed
    ? undefined
    : commandSuggestions.currentArgument;

  const currentArgumentValue = currentArgument
    ? argumentValues[currentArgument.name]
    : undefined;

  const handleSelect = useCallback(
    (suggestion: MasterControlSuggestion) => {
      setError(null);

      if (suggestion.type === "command") {
        setInputValue(`${suggestion.value} `);
        setSelectedEntities({});
        setSuggestionsDismissed(false);
        return;
      }

      if (suggestion.type === "sub-command") {
        setInputValue(`${suggestion.value} `);
        setSelectedEntities({});
        setSuggestionsDismissed(false);
        return;
      }

      if (suggestion.type === "keyword") {
        setInputValue(`${inputValue.trim()} ${suggestion.value} `);
        setSuggestionsDismissed(false);
        return;
      }

      if (suggestion.type === "project") {
        setSelectedEntities((current) => ({
          ...current,
          project: {
            type: "project",
            id: suggestion.project.id,
            label: suggestion.project.name,
            raw: suggestion.project,
          },
        }));

        setInputValue(`${inputValue.trim()} ${suggestion.project.name} `);
        setSuggestionsDismissed(false);
        return;
      }

      if (suggestion.type === "do") {
        setSelectedEntities((current) => ({
          ...current,
          do: {
            type: "do",
            id: suggestion.doItem.id,
            label: suggestion.doItem.title,
            raw: suggestion.doItem,
          },
        }));

        setInputValue(`${inputValue.trim()} ${suggestion.doItem.title} `);
        setSuggestionsDismissed(false);
        return;
      }

      if (suggestion.type === "column") {
        setSelectedEntities((current) => ({
          ...current,
          column: {
            type: "column",
            id: suggestion.column.id,
            label: suggestion.column.name,
            raw: suggestion.column,
          },
        }));

        setInputValue(`${inputValue.trim()} ${suggestion.column.name} `);
        setSuggestionsDismissed(false);
        return;
      }
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
      if (part.type !== "argument") {
        continue;
      }

      const { name, valueType, placeholder, required } = part;
      const value = argumentValues[name]?.trim() ?? "";

      if (required && !value) {
        return `${placeholder || name} is required`;
      }

      if (value && valueType === "color" && !isValidHexColor(value)) {
        return `${name} must be a valid hex color (e.g. #ff0000)`;
      }
    }

    return null;
  }, [selectedSubCommand, argumentValues]);

  const handleExecute = useCallback(async () => {
    if (!selectedSubCommand?.execute) {
      return;
    }

    if (!parsedCommand.complete) {
      const nextPart = parsedCommand.nextPart;

      if (nextPart?.type === "keyword") {
        setError(`Expected "${nextPart.value}"`);
      } else if (nextPart?.type === "argument") {
        setError(`${nextPart.placeholder || nextPart.name} is required`);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
      setSuggestionsDismissed(false);
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
    currentArgument,
    currentArgumentValue,

    selectedSuggestionIndex: commandSuggestions.selectedIndex,

    handleSelect,
    handleInputChange,
    handleInputKeyDown: navigation.handleKeyDown,
  };
};

export default useMasterControl;
