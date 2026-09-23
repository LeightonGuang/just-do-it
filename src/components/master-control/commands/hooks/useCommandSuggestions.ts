import { useEffect, useMemo, useState } from "react";

import { COMMANDS as COMMANDS_LIST } from "../registry";

import type { MasterControlSuggestion } from "../types";
import type { CommandPart, Command, SubCommand } from "../types";

import type { EntitySuggestionsResult } from "./useEntitySuggestions";

type UseCommandSuggestionsOptions = {
  command: string;
  rootCommand: Command | undefined;
  selectedSubCommand: SubCommand | undefined;
  entitySuggestions: EntitySuggestionsResult;
  nextPart?: CommandPart | null;
  args?: Record<string, string>;
  resetSelectionKey?: number;
};

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const useCommandSuggestions = ({
  command,
  rootCommand,
  selectedSubCommand,
  entitySuggestions,
  nextPart,
  args = {},
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
      return {
        suggestions: [],
        currentArgument: undefined,
      };
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);

    if (!rootCommand || (tokens.length <= 1 && !trimmed.endsWith(" "))) {
      const query = trimmed.slice(1).toLowerCase();

      const suggestions: MasterControlSuggestion[] = COMMANDS_LIST.filter(
        (item) => item.name.slice(1).toLowerCase().startsWith(query),
      ).map((item) => ({
        type: "command" as const,
        value: item.name,
        label: item.name,
        description: item.description,
      }));

      return {
        suggestions,
        currentArgument: undefined,
      };
    }

    if (!selectedSubCommand) {
      const subQuery = tokens.length > 1 ? tokens[1].toLowerCase() : "";

      const suggestions: MasterControlSuggestion[] = (
        rootCommand.subCommands || []
      )
        .filter((sub) => sub.name.toLowerCase().startsWith(subQuery))
        .map((sub) => ({
          type: "sub-command" as const,
          value: `${rootCommand.name} ${sub.name}`,
          label: sub.name,
          description: sub.description,
        }));

      return {
        suggestions,
        currentArgument: undefined,
      };
    }

    const lastToken = tokens[tokens.length - 1] ?? "";

    const hasTrailingSpace = /\s$/.test(command);

    const keywordParts = selectedSubCommand.parts.filter(
      (part): part is Extract<CommandPart, { type: "keyword" }> =>
        part.type === "keyword",
    );

    const usedKeywords = new Set(
      keywordParts
        .filter((part) => {
          const regex = new RegExp(
            `(?:^|\\s)${escapeRegex(part.value)}(?:\\s|$)`,
            "i",
          );

          return regex.test(trimmed);
        })
        .map((part) => part.value.toLowerCase()),
    );

    const keywordQuery = hasTrailingSpace ? "" : lastToken.toLowerCase();

    const isKeywordQuery =
      !hasTrailingSpace &&
      keywordParts.some((part) => {
        if (usedKeywords.has(part.value.toLowerCase())) {
          return false;
        }

        return part.value.toLowerCase().startsWith(keywordQuery);
      });

    if (isKeywordQuery) {
      const keywordSuggestions: MasterControlSuggestion[] = keywordParts
        .filter((part) => {
          const value = part.value.toLowerCase();

          if (usedKeywords.has(value)) {
            return false;
          }

          return value.startsWith(keywordQuery);
        })
        .map((part) => ({
          type: "keyword" as const,
          value: part.value,
          label: part.value,
          description: `Keyword: ${part.value}`,
        }));

      return {
        suggestions: keywordSuggestions,
        currentArgument: undefined,
      };
    }

    const keywordSuggestions: MasterControlSuggestion[] = keywordParts
      .filter((part) => {
        const value = part.value.toLowerCase();

        return !usedKeywords.has(value);
      })
      .filter((part) => {
        const partIndex = selectedSubCommand.parts.indexOf(part);

        const argument = selectedSubCommand.parts[partIndex + 1];

        if (!argument || argument.type !== "argument") {
          return false;
        }

        return !args[argument.name];
      })
      .map((part) => ({
        type: "keyword" as const,
        value: part.value,
        label: part.value,
        description: `Keyword: ${part.value}`,
      }));

    if (nextPart?.type === "keyword") {
      const keywordAlreadyUsed = usedKeywords.has(nextPart.value.toLowerCase());

      if (!keywordAlreadyUsed) {
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
    }

    if (
      nextPart?.type === "argument" &&
      nextPart.valueType === "entity" &&
      nextPart.entityType
    ) {
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

    if (keywordSuggestions.length > 0) {
      return {
        suggestions: keywordSuggestions,
        currentArgument: nextPart?.type === "argument" ? nextPart : undefined,
      };
    }

    return {
      suggestions: [],
      currentArgument: nextPart?.type === "argument" ? nextPart : undefined,
    };
  }, [
    command,
    rootCommand,
    selectedSubCommand,
    entitySuggestions,
    nextPart,
    args,
  ]);

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

export default useCommandSuggestions;
