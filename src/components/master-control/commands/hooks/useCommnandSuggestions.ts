import { useEffect, useMemo, useState } from "react";

import type { Project } from "../../../../db/schema";
import type { MasterControlSuggestion } from "../types";

import { type SubCommand } from '../registry';
import { COMMANDS, type Command, type CommandPart } from '../registry';

type UseCommandSuggestionsOptions = {
  command: string;
  rootCommand: Command | undefined;
  selectedSubCommand: SubCommand | undefined;
  projectSuggestions: Project[];
  nextPart?: CommandPart;
  resetSelectionKey?: number;
};

const getCurrentArgument = (
  command: string,
  selectedSubCommand: SubCommand,
) => {
  const tokens = command.trim().split(/\s+/).filter(Boolean);
  const argumentTokens = tokens.slice(2);

  const argumentParts =
    selectedSubCommand.parts?.filter(
      (part) => part.type === "argument",
    ) ?? [];

  if (argumentParts.length === 0) {
    return undefined;
  }

  const projectArgument = argumentParts.find(
    (part) =>
      part.type === "argument" &&
      part.argument.kind === "entity" &&
      part.argument.entityType === "project",
  );

  const colorArgument = argumentParts.find(
    (part) =>
      part.type === "argument" &&
      part.argument.kind === "color",
  );

  const hasColor = argumentTokens.some((token) =>
    token.startsWith("#"),
  );

  if (hasColor && colorArgument?.type === "argument") {
    return colorArgument.argument;
  }

  if (projectArgument?.type === "argument") {
    return projectArgument.argument;
  }

  return undefined;
};

const useCommandSuggestions = ({
  command,
  rootCommand,
  selectedSubCommand,
  projectSuggestions,
  nextPart,
  resetSelectionKey,
}: UseCommandSuggestionsOptions) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [resetSelectionKey]);

  const result = useMemo(() => {
    const trimmed = command.trim();

    if (!trimmed.startsWith("/")) {
      return {
        suggestions: [],
        currentArgument: undefined,
      };
    }

    if (!rootCommand) {
      const query = trimmed.slice(1).toLowerCase();

      return {
        suggestions: COMMANDS.filter((item) =>
          item.command
            .slice(1)
            .toLowerCase()
            .startsWith(query),
        ).map((item) => ({
          type: "command" as const,
          value: item.command,
          label: item.command,
          description: item.description,
        })),
        currentArgument: undefined,
      };
    }

    if (!selectedSubCommand) {
      const query = trimmed
        .slice(rootCommand.command.length)
        .trim()
        .toLowerCase();

      return {
        suggestions:
          rootCommand.subCommands
            ?.filter((item) =>
              item.name.toLowerCase().startsWith(query),
            )
            .map((item) => ({
              type: "sub-command" as const,
              value: `${rootCommand.command} ${item.name}`,
              label: item.name,
              description: item.description,
            })) ?? [],
        currentArgument: undefined,
      };
    }

    const currentArgument = getCurrentArgument(
      command,
      selectedSubCommand,
    );

    const argumentTokens = trimmed
      .split(/\s+/)
      .filter(Boolean)
      .slice(2);

    const hasColor = argumentTokens.some((token) =>
      token.startsWith("#"),
    );

    if (
      !hasColor &&
      nextPart?.type === "argument" &&
      nextPart.argument.kind === "entity" &&
      nextPart.argument.entityType === "project"
    ) {
      return {
        suggestions: projectSuggestions.map((project) => ({
          type: "project" as const,
          project,
        })),
        currentArgument,
      };
    }

    return {
      suggestions: [],
      currentArgument,
    };
  }, [
    command,
    rootCommand,
    selectedSubCommand,
    projectSuggestions,
    nextPart,
  ]);

  const moveUp = () => {
    setSelectedIndex((current) =>
      Math.max(current - 1, 0),
    );
  };

  const moveDown = () => {
    setSelectedIndex((current) =>
      Math.min(
        current + 1,
        Math.max(result.suggestions.length - 1, 0),
      ),
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
