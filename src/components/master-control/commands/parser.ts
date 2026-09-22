import type { SubCommand, CommandPart, SelectedEntity } from "./types";

export type ParsedCommand = {
  args: Record<string, string>;
  entities: Record<string, SelectedEntity>;
  complete: boolean;
  nextPart: CommandPart | null;
};

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const parseCommand = (
  inputValue: string,
  selectedSubCommand?: SubCommand,
  selectedEntities: Record<string, SelectedEntity> = {},
): ParsedCommand => {
  if (!selectedSubCommand) {
    return {
      args: {},
      entities: selectedEntities,
      complete: false,
      nextPart: null,
    };
  }

  const parts = selectedSubCommand.parts;
  const input = inputValue.trim();

  const tokens = input.split(/\s+/).filter(Boolean);

  if (tokens.length < 2) {
    return {
      args: {},
      entities: selectedEntities,
      complete: false,
      nextPart: parts[0] ?? null,
    };
  }

  /*
   * Remove:
   *
   * /edit project
   *
   * leaving:
   *
   * This name New colour #ffffff
   */
  const commandPrefix = `${tokens[0]} ${tokens[1]}`;

  let remaining = input.slice(commandPrefix.length).trim();

  const args: Record<string, string> = {};

  /*
   * Find all keywords that exist in this command.
   */
  const keywordParts = parts
    .map((part, index) => ({
      part,
      index,
    }))
    .filter(
      (
        item,
      ): item is {
        part: Extract<CommandPart, { type: "keyword" }>;
        index: number;
      } => item.part.type === "keyword",
    );

  /*
   * Find the positions of keywords in the input.
   */
  const foundKeywords: {
    partIndex: number;
    keyword: string;
    index: number;
    end: number;
  }[] = [];

  for (const { part, index: partIndex } of keywordParts) {
    const regex = new RegExp(`\\b${escapeRegex(part.value)}\\b`, "gi");

    let match: RegExpExecArray | null;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index === undefined) continue;

      foundKeywords.push({
        partIndex,
        keyword: part.value,
        index: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  /*
   * Sort keywords by where they occur in the input.
   */
  foundKeywords.sort((a, b) => a.index - b.index);

  /*
   * Parse the first required entity.
   *
   * Everything before the first keyword belongs to the
   * project argument.
   */
  const projectPartIndex = parts.findIndex(
    (part) => part.type === "argument" && part.valueType === "entity",
  );

  if (projectPartIndex !== -1) {
    const firstKeyword = foundKeywords[0];

    if (firstKeyword) {
      const projectValue = remaining.slice(0, firstKeyword.index).trim();

      if (projectValue) {
        args[
          parts[projectPartIndex].type === "argument"
            ? parts[projectPartIndex].name
            : "project"
        ] = projectValue;
      }
    } else if (remaining) {
      const selectedProject = selectedEntities.project;

      if (selectedProject) {
        args.project = selectedProject.label;
      } else {
        /*
         * Project entity is normally one value.
         */
        const spaceIndex = remaining.indexOf(" ");

        if (spaceIndex === -1) {
          args.project = remaining;
        } else {
          args.project = remaining.slice(0, spaceIndex).trim();
        }
      }
    }
  }

  /*
   * Parse each keyword's argument.
   *
   * Example:
   *
   * name New colour #fff
   *
   * becomes:
   *
   * name   -> New
   * colour -> #fff
   */
  for (let i = 0; i < foundKeywords.length; i++) {
    const current = foundKeywords[i];

    const keywordPart = parts[current.partIndex];

    if (keywordPart.type !== "keyword") continue;

    const argumentPart = parts[current.partIndex + 1];

    if (!argumentPart || argumentPart.type !== "argument") continue;

    const valueStart = current.end;

    const valueEnd = foundKeywords[i + 1]?.index ?? remaining.length;

    const value = remaining.slice(valueStart, valueEnd).trim();

    if (value) {
      /*
       * Colour arguments should only receive the colour.
       */
      if (argumentPart.valueType === "colour") {
        const colourMatch = value.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);

        if (colourMatch) args[argumentPart.name] = colourMatch[0];
      } else {
        args[argumentPart.name] = value;
      }
    }
  }

  /*
   * Work out whether the command is complete.
   */
  let complete = true;
  let nextPart: CommandPart | null = null;

  /*
   * Required arguments must exist.
   */
  for (const part of parts) {
    if (part.type !== "argument" || !part.required) {
      continue;
    }

    const value = args[part.name]?.trim();

    if (!value) {
      complete = false;
      nextPart = part;
      break;
    }
  }

  /*
   * If we're currently typing a keyword but haven't
   * supplied its argument, expose that argument.
   */
  if (complete && remaining) {
    const lastKeyword = foundKeywords[foundKeywords.length - 1];

    if (lastKeyword) {
      const argumentPart = parts[lastKeyword.partIndex + 1];

      if (argumentPart?.type === "argument") {
        const value = remaining.slice(lastKeyword.end).trim();

        if (!value) {
          complete = false;
          nextPart = argumentPart;
        }
      }
    }
  }

  return {
    args,
    entities: selectedEntities,
    complete,
    nextPart,
  };
};
