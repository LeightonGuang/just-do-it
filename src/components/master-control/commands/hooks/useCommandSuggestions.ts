// hooks/useCommandSuggestions.ts
import { useEffect, useMemo, useState } from "react";

import { tokenize, type Token } from "../tokenize";
import { COMMANDS as COMMANDS_LIST } from "../registry";

import type { SubCommand } from "../types";
import type { CommandPart, MasterControlSuggestion, Command } from "../types";

import type { EntitySuggestionsResult } from "./useEntitySuggestions";

type KeywordPart = Extract<CommandPart, { type: "keyword" }>;

type UseCommandSuggestionsOptions = {
  command: string;
  caret: number;
  rootCommand: Command | undefined;
  selectedSubCommand: SubCommand | undefined;
  entitySuggestions: EntitySuggestionsResult;
  activePart?: CommandPart | null;
  activeToken?: Token | null;
  availableKeywords?: KeywordPart[];
  resetSelectionKey?: number;
};

const useCommandSuggestions = ({
  command,
  caret,
  rootCommand,
  selectedSubCommand,
  entitySuggestions,
  activePart,
  activeToken,
  availableKeywords,
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
    if (!command.trimStart().startsWith("/")) {
      return { suggestions: [], currentArgument: undefined };
    }

    const tokens = tokenize(command);
    const activeIdx = tokens.findIndex(
      (t) => caret >= t.start && caret <= t.end,
    );

    // --- caret is in the root token, or nothing's been typed yet ---
    if (!rootCommand || activeIdx === 0 || tokens.length === 0) {
      const query = (tokens[0]?.text ?? "").replace(/^\//, "").toLowerCase();

      return {
        suggestions: COMMANDS_LIST.filter((item) =>
          item.name.slice(1).toLowerCase().startsWith(query),
        ).map((item) => ({
          type: "command" as const,
          value: item.name,
          label: item.name,
          description: item.description,
        })),
        currentArgument: undefined,
      };
    }

    // --- caret is in the sub-command token ---
    if (!selectedSubCommand) {
      const query = (tokens[1]?.text ?? "").toLowerCase();

      return {
        suggestions: (rootCommand.subCommands ?? [])
          .filter((sub) => sub.name.toLowerCase().startsWith(query))
          .map((sub) => ({
            type: "sub-command" as const,
            value: `${rootCommand.name} ${sub.name}`,
            label: sub.name,
            description: sub.description,
          })),
        currentArgument: undefined,
      };
    }

    // --- unordered flex-phase keywords (e.g. "name"/"colour" in any order) ---
    if (availableKeywords && availableKeywords.length > 0) {
      return {
        suggestions: availableKeywords.map((kw) => ({
          type: "keyword" as const,
          value: kw.value,
          label: kw.value,
          description: `Keyword: ${kw.value}`,
        })),
        currentArgument: undefined,
      };
    }

    // --- caret is on a required/leading keyword part ---
    if (activePart?.type === "keyword") {
      const keyword = activePart.value;
      const query = (activeToken?.text ?? "").toLowerCase();

      if (!query || keyword.toLowerCase().startsWith(query)) {
        return {
          suggestions: [
            {
              type: "keyword",
              value: keyword,
              label: keyword,
              description: `Keyword: ${keyword}`,
            },
          ],
          currentArgument: undefined,
        };
      }

      return { suggestions: [], currentArgument: undefined };
    }

    // --- caret is on an entity argument ---
    if (
      activePart?.type === "argument" &&
      activePart.valueType === "entity" &&
      activePart.entityType
    ) {
      if (activePart.entityType === "project") {
        return {
          suggestions: entitySuggestions.projects.map((project) => ({
            type: "project" as const,
            project,
          })),
          currentArgument: activePart,
        };
      }

      if (activePart.entityType === "do") {
        return {
          suggestions: entitySuggestions.dos.map((doItem) => ({
            type: "do" as const,
            doItem,
          })),
          currentArgument: activePart,
        };
      }

      if (activePart.entityType === "column") {
        return {
          suggestions: entitySuggestions.columns.map((column) => ({
            type: "column" as const,
            column,
          })),
          currentArgument: activePart,
        };
      }
    }

    return {
      suggestions: [],
      currentArgument: activePart?.type === "argument" ? activePart : undefined,
    };
  }, [
    command,
    caret,
    rootCommand,
    selectedSubCommand,
    entitySuggestions,
    activePart,
    activeToken,
    availableKeywords,
  ]);

  const moveUp = () => setSelectedIndex((c) => Math.max(c - 1, 0));

  const moveDown = () =>
    setSelectedIndex((c) =>
      Math.min(c + 1, Math.max(result.suggestions.length - 1, 0)),
    );

  const reset = () => setSelectedIndex(0);

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
