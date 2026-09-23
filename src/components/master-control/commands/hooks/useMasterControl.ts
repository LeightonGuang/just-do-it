// hooks/useMasterControl.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { COMMANDS } from "../registry";
import { parseCommand } from "../parser";
import useInputNavigation from "./useInputNavigation";
import useEntitySuggestions from "./useEntitySuggestions";
import useCommandSuggestions from "./useCommandSuggestions";
import { useKanban } from "../../../contexts/KanbanContext";
import { useSidebar } from "../../../contexts/SidebarContext";

import type { MasterControlSuggestion, SelectedEntity } from "../types";

const isValidHexColur = (value: string) => {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

const useMasterControl = (
  inputRef: React.RefObject<HTMLInputElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
) => {
  const { fetchSidebarDos, fetchSidebarProjects } = useSidebar();
  const { projectId: currentProjectId, fetchKanban } = useKanban();

  const [inputValue, setInputValue] = useState("");
  const [caret, setCaret] = useState(0);
  const [selectedEntities, setSelectedEntities] = useState<
    Record<string, SelectedEntity>
  >({});
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  const pendingCaretRef = useRef<number | null>(null);

  const tokens = useMemo(() => {
    return inputValue.trim().split(/\s+/).filter(Boolean);
  }, [inputValue]);

  const root = tokens[0] ?? "";
  const subCommandToken = tokens[1] ?? "";

  const rootCommand = useMemo(() => {
    return COMMANDS.find((item) => item.name === root);
  }, [root]);

  const selectedSubCommand = useMemo(() => {
    if (!rootCommand || !subCommandToken) {
      return undefined;
    }

    return rootCommand.subCommands?.find(
      (item) => item.name === subCommandToken,
    );
  }, [rootCommand, subCommandToken]);

  const parsedCommand = useMemo(() => {
    return parseCommand(
      inputValue,
      caret,
      selectedSubCommand,
      selectedEntities,
    );
  }, [inputValue, caret, selectedSubCommand, selectedEntities]);

  const argumentValues = parsedCommand.args;
  const activePart = parsedCommand.activePart;
  const activeToken = parsedCommand.activeToken;
  const availableKeywords = parsedCommand.availableKeywords;

  const argumentParts =
    selectedSubCommand?.parts?.filter((part) => part.type === "argument") ?? [];

  const activeEntityType =
    activePart?.type === "argument" && activePart.valueType === "entity"
      ? activePart.entityType
      : undefined;

  const entityQuery =
    activePart?.type === "argument" && activePart.valueType === "entity"
      ? (activeToken?.text ?? argumentValues[activePart.name] ?? "")
      : "";

  const selectedProjectId = selectedEntities.project?.id;

  const projectArgumentPart = argumentParts.find(
    (part) =>
      part.name === "project" &&
      part.valueType === "entity" &&
      part.entityType === "project",
  );

  const projectQuery = projectArgumentPart
    ? (argumentValues[projectArgumentPart.name] ?? "")
    : "";

  const entityProjectId = selectedProjectId ?? currentProjectId;

  const entitySuggestions = useEntitySuggestions({
    enabled: !!activeEntityType,
    entityType: activeEntityType,
    query: entityQuery,

    projectId: activeEntityType === "do" ? entityProjectId : undefined,

    projectQuery: activeEntityType === "do" ? projectQuery : undefined,
  });

  const commandSuggestions = useCommandSuggestions({
    command: inputValue,
    caret,
    rootCommand,
    selectedSubCommand,
    entitySuggestions,
    activePart,
    activeToken,
    availableKeywords,
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

  // replaces whatever token the caret is in (or appends, if caret is past
  // the end / on empty input), then moves the caret after the insertion
  const applyAtCaret = useCallback(
    (insertText: string) => {
      const tok = activeToken;
      const before = tok
        ? inputValue.slice(0, tok.start)
        : inputValue.slice(0, caret);
      const after = tok ? inputValue.slice(tok.end) : inputValue.slice(caret);

      const needsSpaceBefore = before.length > 0 && !before.endsWith(" ");
      const glue = needsSpaceBefore ? " " : "";

      const next = `${before}${glue}${insertText} ${after.trimStart()}`;
      const newCaret = (before + glue + insertText).length + 1;

      setInputValue(next);
      pendingCaretRef.current = newCaret;
    },
    [inputValue, caret, activeToken],
  );

  const handleSelect = useCallback(
    (suggestion: MasterControlSuggestion) => {
      setError(null);

      if (suggestion.type === "command") {
        setInputValue(`${suggestion.value} `);
        pendingCaretRef.current = suggestion.value.length + 1;
        setSelectedEntities({});
        setSuggestionsDismissed(false);
        return;
      }

      if (suggestion.type === "sub-command") {
        setInputValue(`${suggestion.value} `);
        pendingCaretRef.current = suggestion.value.length + 1;
        setSelectedEntities({});
        setSuggestionsDismissed(false);
        return;
      }

      if (suggestion.type === "keyword") {
        applyAtCaret(suggestion.value);
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

        applyAtCaret(suggestion.project.name);
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

        applyAtCaret(suggestion.doItem.title);
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

        applyAtCaret(suggestion.column.name);
        setSuggestionsDismissed(false);
      }
    },
    [applyAtCaret],
  );

  // input's onChange should call this with (value, selectionStart)
  const handleInputChange = useCallback((value: string, nextCaret: number) => {
    setInputValue(value);
    setCaret(nextCaret);
    setError(null);
    setSuggestionsDismissed(false);
  }, []);

  // input's onSelect (covers clicks + arrow-key caret moves) should call this
  const handleCaretChange = useCallback((nextCaret: number) => {
    setCaret(nextCaret);
  }, []);

  useEffect(() => {
    if (pendingCaretRef.current === null) return;
    const pos = pendingCaretRef.current;
    pendingCaretRef.current = null;

    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(pos, pos);
      setCaret(pos);
    });
  }, [inputValue, inputRef]);

  const handleInputBlur = useCallback(() => {
    window.setTimeout(() => {
      const activeElement = document.activeElement;

      if (!containerRef.current?.contains(activeElement)) {
        setSuggestionsDismissed(true);
      }
    }, 0);
  }, [containerRef]);

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

      if (required && !value) return `${placeholder || name} is required`;

      if (value && valueType === "colour" && !isValidHexColur(value)) {
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
      const part = activePart;

      if (part?.type === "keyword") {
        setError(`Expected "${part.value}"`);
      } else if (part?.type === "argument") {
        setError(`${part.placeholder || part.name} is required`);
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
        projectId: currentProjectId,
        refetch: {
          projects: fetchSidebarProjects,
          dos: fetchSidebarDos,
          kanban: fetchKanban,
        },
      });

      setInputValue("");
      setCaret(0);
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
    activePart,
    argumentValues,
    selectedEntities,
    validateArguments,
    fetchSidebarProjects,
    fetchSidebarDos,
    fetchKanban,
    currentProjectId,
  ]);

  const reset = useCallback(() => {
    setInputValue("");
    setCaret(0);
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
      setCaret(1);
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
    caret,
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
    handleCaretChange,
    handleInputBlur,
    handleInputKeyDown: navigation.handleKeyDown,
  };
};

export default useMasterControl;
