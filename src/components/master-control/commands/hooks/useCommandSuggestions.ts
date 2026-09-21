import { useEffect, useMemo, useState } from "react";

import type { MasterControlSuggestion } from "../types";
import type { Command, SubCommand, CommandPart } from "../types";
import type { EntitySuggestionsResult } from "./useEntitySuggestions";

type UseCommandSuggestionsOptions = {
  command: string;
  rootCommand: Command | undefined;
  selectedSubCommand: SubCommand | undefined;
  entitySuggestions: EntitySuggestionsResult;
  nextPart?: CommandPart | null;
  resetSelectionKey?: number;
};

const useCommandSuggestions = ({
  command,
  rootCommand,
  selectedSubCommand,
  entitySuggestions,
  nextPart,
  resetSelectionKey,
}: UseCommandSuggestionsOptions) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [resetSelectionKey, command]);

  const result = useMemo<{
    suggestions: MasterControlSuggestion[];
    currentArgument?: Extract<CommandPart, { type: "argument" }>;
  }>(() => {
    const trimmed = command.trimStart();

    if (!trimmed.startsWith("/")) {
      return { suggestions: [], currentArgument: undefined };
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);

    // Case 1: Typing root command (e.g. "/", "/c", "/cre")
    if (!rootCommand || (tokens.length <= 1 && !trimmed.endsWith(" "))) {
      const query = trimmed.slice(1).toLowerCase();
      const suggestions: MasterControlSuggestion[] = (COMMANDS_LIST || [])
        .filter((item) => item.name.slice(1).toLowerCase().startsWith(query))
        .map((item) => ({
          type: "command",
          value: item.name,
          label: item.name,
          description: item.description,
        }));

      return { suggestions, currentArgument: undefined };
    }

    // Case 2: Root command matched, choosing subcommand (e.g. "/create ", "/create p")
    if (!selectedSubCommand) {
      const subQuery = tokens.length > 1 ? tokens[1].toLowerCase() : "";
      const suggestions: MasterControlSuggestion[] = (
        rootCommand.subCommands || []
      )
        .filter((sub) => sub.name.toLowerCase().startsWith(subQuery))
        .map((sub) => ({
          type: "sub-command",
          value: `${rootCommand.name} ${sub.name}`,
          label: sub.name,
          description: sub.description,
        }));

      return { suggestions, currentArgument: undefined };
    }

    // Case 3: Subcommand selected, checking next expected part
    if (nextPart?.type === "keyword") {
      return {
        suggestions: [
          {
            type: "keyword",
            value: nextPart.value,
            label: nextPart.value,
            description: `Keyword: ${nextPart.value}`,
          },
        ],
        currentArgument: undefined,
      };
    }

    if (nextPart?.type === "argument") {
      if (nextPart.valueType === "entity" && nextPart.entityType) {
        if (nextPart.entityType === "project") {
          return {
            suggestions: entitySuggestions.projects.map((project) => ({
              type: "project" as const,
              project,
            })),
            currentArgument: nextPart,
          };
        }
        if (nextPart.entityType === "do") {
          return {
            suggestions: entitySuggestions.dos.map((doItem) => ({
              type: "do" as const,
              doItem,
            })),
            currentArgument: nextPart,
          };
        }
        if (nextPart.entityType === "column") {
          return {
            suggestions: entitySuggestions.columns.map((column) => ({
              type: "column" as const,
              column,
            })),
            currentArgument: nextPart,
          };
        }
      }

      return {
        suggestions: [],
        currentArgument: nextPart,
      };
    }

    return { suggestions: [], currentArgument: undefined };
  }, [command, rootCommand, selectedSubCommand, entitySuggestions, nextPart]);

  const moveUp = () => {
    setSelectedIndex((current) => Math.max(current - 1, 0));
  };

  const moveDown = () => {
    setSelectedIndex((current) =>
      Math.min(current + 1, Math.max(result.suggestions.length - 1, 0)),
    );
  };

  const reset = () => {
    setSelectedIndex(0);
  };

  return {
    suggestions: result.suggestions,
    rawSuggestions: result.suggestions,
    currentArgument: result.currentArgument,
    selectedIndex,
    moveUp,
    moveDown,
    reset,
    setSelectedIndex,
  };
};

import { COMMANDS as COMMANDS_LIST } from "../registry";

export default useCommandSuggestions;
