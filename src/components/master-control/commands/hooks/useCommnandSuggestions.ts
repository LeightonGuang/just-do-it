import { useMemo, useState } from "react";

import type { Project } from "../../../../db/schema";
import type { MasterControlSuggestion } from "../types";

import { type SubCommand } from "../registry";
import { COMMANDS, type Command, type CommandPart } from "../registry";

type UseCommandSuggestionsOptions = {
  command: string;
  rootCommand: Command | undefined;
  selectedSubCommand: SubCommand | undefined;
  projectSuggestions: Project[];
  nextPart?: CommandPart;
};

const useCommandSuggestions = ({
  command,
  rootCommand,
  selectedSubCommand,
  projectSuggestions,
  nextPart,
}: UseCommandSuggestionsOptions) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const suggestions = useMemo<MasterControlSuggestion[]>(() => {
    const trimmedCommand = command.trim();

    if (!trimmedCommand.startsWith("/")) {
      return [];
    }

    if (!rootCommand) {
      const query = trimmedCommand.slice(1).toLowerCase();

      return COMMANDS.filter((item) =>
        item.command.slice(1).toLowerCase().startsWith(query),
      ).map((item) => ({
        type: "command" as const,
        value: item.command,
        label: item.command,
        description: item.description,
      }));
    }

    if (!selectedSubCommand) {
      const query = trimmedCommand
        .slice(rootCommand.command.length)
        .trim()
        .toLowerCase();

      return (
        rootCommand.subCommands
          ?.filter((subCommand) =>
            subCommand.name.toLowerCase().startsWith(query),
          )
          .map((subCommand) => ({
            type: "sub-command" as const,
            value: `${rootCommand.command} ${subCommand.name}`,
            label: subCommand.name,
            description: subCommand.description,
          })) ?? []
      );
    }

    if (!nextPart) {
      return [];
    }

    if (nextPart.type === "keyword") {
      const query = getCurrentPartQuery(
        trimmedCommand,
        selectedSubCommand,
        nextPart,
      );

      if (
        query &&
        !nextPart.keyword.value.toLowerCase().startsWith(query.toLowerCase())
      ) {
        return [];
      }

      return [
        {
          type: "keyword",
          value: nextPart.keyword.value,
          label: nextPart.keyword.value,
          description: nextPart.keyword.description ?? "",
        },
      ];
    }

    if (nextPart.type === "argument" && nextPart.argument.kind === "entity") {
      if (nextPart.argument.entityType === "project") {
        return projectSuggestions.map((project) => ({
          type: "project" as const,
          project,
        }));
      }
    }

    return [];
  }, [command, rootCommand, selectedSubCommand, projectSuggestions, nextPart]);

  const moveUp = () => {
    setSelectedIndex((current) => Math.max(current - 1, 0));
  };

  const moveDown = () => {
    setSelectedIndex((current) =>
      Math.min(current + 1, Math.max(suggestions.length - 1, 0)),
    );
  };

  const reset = () => {
    setSelectedIndex(0);
  };

  return {
    suggestions,
    rawSuggestions: suggestions,
    selectedIndex,
    moveUp,
    moveDown,
    reset,
  };
};

const getCurrentPartQuery = (
  command: string,
  selectedSubCommand: SubCommand,
  nextPart: CommandPart,
) => {
  if (nextPart.type !== "keyword") {
    return "";
  }

  const parts = selectedSubCommand.parts ?? [];
  const nextPartIndex = parts.findIndex(
    (part) =>
      part.type === "keyword" && part.keyword.value === nextPart.keyword.value,
  );

  if (nextPartIndex === -1) {
    return "";
  }

  return "";
};

export default useCommandSuggestions;
