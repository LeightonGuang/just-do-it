import { useEffect, useMemo, useState } from "react";

import { COMMANDS } from "../registry";

import type { Project } from "../../../../db/schema";
import type { MasterControlSuggestion } from "../types";

type UseCommandSuggestionsOptions = {
  command: string;
  rootCommand?: (typeof COMMANDS)[number];
  selectedSubCommand?: NonNullable<
    (typeof COMMANDS)[number]["subCommands"]
  >[number];
  projectSuggestions: Project[];
};

const useCommandSuggestions = ({
  command,
  rootCommand,
  selectedSubCommand,
  projectSuggestions,
}: UseCommandSuggestionsOptions) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const rawSuggestions = useMemo<MasterControlSuggestion[]>(() => {
    if (!command.startsWith("/")) return [];

    /*
     * Dynamic argument suggestions.
     */
    const isDeleteProject =
      rootCommand?.command === "/delete" &&
      selectedSubCommand?.name === "project";

    if (isDeleteProject) {
      return projectSuggestions.map((project) => ({
        type: "project",
        project,
        value: project.name,
        label: project.name,
      }));
    }

    /*
     * A complete subcommand has been selected.
     * At this point there are no command suggestions.
     */
    if (selectedSubCommand) return [];

    /*
     * /
     */
    if (command === "/") {
      return COMMANDS.map((item) => ({
        type: "command",
        value: item.command,
        label: item.command,
        description: item.description,
      }));
    }

    /*
     * /del
     */
    if (!command.includes(" ")) {
      return COMMANDS.filter((item) => item.command.startsWith(command)).map(
        (item) => ({
          type: "command",
          value: item.command,
          label: item.command,
          description: item.description,
        }),
      );
    }

    /*
     * /delete p
     */
    if (rootCommand?.subCommands) {
      const [, subQuery = ""] = command.split(" ");

      return rootCommand.subCommands
        .filter((item) => item.name.startsWith(subQuery))
        .map((item) => ({
          type: "sub-command",
          value: `${rootCommand.command} ${item.name}`,
          label: item.name,
          description: item.description,
        }));
    }

    return [];
  }, [command, rootCommand, selectedSubCommand, projectSuggestions]);

  /*
   * Any time the underlying suggestions change,
   * start from the first suggestion.
   */
  useEffect(() => {
    setSelectedIndex(0);
  }, [rawSuggestions]);

  const suggestions = dismissed ? [] : rawSuggestions;

  const selectedSuggestion = suggestions[selectedIndex];

  const moveDown = () => {
    if (suggestions.length === 0) return;

    setSelectedIndex((current) =>
      current >= suggestions.length - 1 ? 0 : current + 1,
    );
  };

  const moveUp = () => {
    if (suggestions.length === 0) return;

    setSelectedIndex((current) =>
      current <= 0 ? suggestions.length - 1 : current - 1,
    );
  };

  const dismiss = () => {
    setDismissed(true);
  };

  const reopen = () => {
    if (rawSuggestions.length > 0) setDismissed(false);
  };

  const reset = () => {
    setSelectedIndex(0);
    setDismissed(false);
  };

  return {
    suggestions,
    rawSuggestions,

    selectedIndex,
    selectedSuggestion,

    dismissed,

    moveUp,
    moveDown,
    dismiss,
    reopen,
    reset,
  };
};

export default useCommandSuggestions;
